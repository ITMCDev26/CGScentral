/* ==========================================================================
   CGS CENTRAL — Google Sheets backend (Apps Script Web App)
   --------------------------------------------------------------------------
   Endpoints (used by sheets-api.js):
     GET  ?action=loadAll                -> { ok:true, data:{ orders, catalog, vehicles,
                                             users, townships, availabilityLog, orderSeq } }
     POST {action:"saveAll", data:{...}} -> replaces every tab with the payload
     POST {action:"checkReleases"}       -> runs the "item is now available" release check

   Storage: each tab keeps ID in column A and the full JSON object in column B.
   Orders also get a few readable summary columns (C onward) for browsing in
   the Sheet UI — they are write-only; the app always reads from column B.
   ========================================================================== */

var TABS = {
  orders:          { name: "Orders",          idKey: "id" },
  catalog:         { name: "Catalog",         idKey: "id" },
  vehicles:        { name: "Vehicles",        idKey: "id" },
  users:           { name: "Users",           idKey: "email" },
  townships:       { name: "Townships",       idKey: null },   // plain strings
  availabilityLog: { name: "AvailabilityLog", idKey: "id" }
};
var META_TAB = "Meta";

/* Delivery Receipt (Google Doc) settings.
   Signature images are optional: upload signatures/approver-signature.png and
   signatures/releaser-signature.png to Google Drive, then paste each file's ID
   (the long string in the file's share link) below. Leave "" for blank signing space. */
var DR_SETTINGS = {
  folderName: "CGS Central DRs",
  approverSignatureFileId: "",   // "CHECKED AND APPROVED BY"
  releaserSignatureFileId: "",   // "RELEASED BY"
  shareWithLink: true            // true = anyone with the link can VIEW/print; false = only you (the script owner)
};

/* ---------- ONE-TIME SETUP: run this once from the editor ---------- */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(function (k) {
    var sh = getOrCreateSheet_(ss, TABS[k].name);
    if (sh.getLastRow() === 0) {
      var headers = headersFor_(k);
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
      sh.setFrozenRows(1);
    }
  });
  var meta = getOrCreateSheet_(ss, META_TAB);
  if (meta.getLastRow() === 0) {
    meta.getRange(1, 1, 2, 2).setValues([["key", "value"], ["orderSeq", 1]]);
    meta.getRange(1, 1, 1, 2).setFontWeight("bold");
  }
  getDRFolder_(true);
  installDailyTrigger();
}

/* Daily release check at ~6 AM (script timezone). Safe to run repeatedly. */
function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "checkReleases") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("checkReleases").timeBased().everyDays(1).atHour(6).create();
}

/* ---------- WEB APP ENTRY POINTS ---------- */
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  try {
    if (action === "loadAll") return json_({ ok: true, data: loadAll_() });
    if (action === "loadUsers") return json_({ ok: true, data: readUsers_(SpreadsheetApp.getActiveSpreadsheet()) });
    return json_({ ok: true, message: "CGS Central backend is running." });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, error: "Bad request." }); }

  // Drive/Docs actions don't touch the sheet, so no need to hold the lock.
  try {
    if (body.action === "uploadImage") { var up = uploadImage_(body); up.ok = true; return json_(up); }
    if (body.action === "createDR")    { var dr = createDR_(body.dr);  dr.ok = true; return json_(dr); }
    if (body.action === "getDRPdf")    { var pdf = getDRPdf_(body.docId); pdf.ok = true; return json_(pdf); }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    if (body.action === "saveAll") {
      saveAll_(body.data || {});
      return json_({ ok: true });
    }
    if (body.action === "registerUser") {
      return json_(registerUser_(body.user));
    }
    if (body.action === "checkReleases") {
      var n = checkReleases();
      return json_({ ok: true, released: n });
    }
    return json_({ ok: false, error: "Unknown action: " + body.action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- LOAD ---------- */
function loadAll_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = {};
  Object.keys(TABS).forEach(function (k) {
    out[k] = (k === "users") ? readUsers_(ss) : readTab_(ss, TABS[k].name);
  });
  out.orderSeq = readOrderSeq_(ss);
  return out;
}

function readTab_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  var result = [];
  rows.forEach(function (r) {
    if (r[1] === "" || r[1] === null) return;
    try { result.push(JSON.parse(r[1])); } catch (e) { /* skip corrupt row */ }
  });
  return result;
}

function readOrderSeq_(ss) {
  var sh = ss.getSheetByName(META_TAB);
  if (!sh) return 1;
  var vals = sh.getDataRange().getValues();
  for (var i = 0; i < vals.length; i++) {
    if (vals[i][0] === "orderSeq") return Number(vals[i][1]) || 1;
  }
  return 1;
}

/* ---------- SAVE ---------- */
function saveAll_(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(function (k) {
    if (!Array.isArray(data[k])) return; // only touch tabs that were sent
    var items = data[k];
    // accounts are merged, never replaced: a stale browser can't wipe out sign-ups made elsewhere
    if (k === "users") items = mergeUsers_(readUsers_(ss), items);
    writeTab_(ss, k, items);
  });
  if (data.orderSeq != null) writeOrderSeq_(ss, data.orderSeq);
}

function writeTab_(ss, key, items) {
  var cfg = TABS[key];
  var sh = getOrCreateSheet_(ss, cfg.name);

  var rows = items.map(function (it) {
    var isObj = typeof it === "object" && it !== null;
    var id = cfg.idKey ? it[cfg.idKey] : (isObj ? it.name : it);
    var payload = JSON.stringify(cfg.idKey ? it : (isObj ? it : { name: it }));
    var row = [id, payload];
    if (key === "townships") row = row.concat([isObj ? (it.legalName || "") : "", isObj ? (it.address || "") : ""]);
    if (key === "orders") row = row.concat(orderSummary_(it));
    if (key === "catalog") row = row.concat(catalogSummary_(it));
    if (key === "users") row = row.concat(userSummary_(it));
    return row;
  });

  // keep the header row in sync (older sheets only had ID | JSON)
  var headers = headersFor_(key);
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  sh.setFrozenRows(1);

  // clear old data (keep header), then write in one batch
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, Math.max(sh.getLastColumn(), 2)).clearContent();
  if (rows.length) {
    var width = rows[0].length;
    sh.getRange(2, 1, rows.length, width).setValues(rows);
  }
}

function orderSummary_(o) {
  var total = 0;
  (o.items || []).forEach(function (i) { total += (Number(i.rate) || 0) * (Number(i.qty) || 0); });
  return [
    o.status || "",
    o.segment || "",
    o.township || "",
    (o.userName || "") + " <" + (o.userEmail || "") + ">",
    o.createdAt ? new Date(o.createdAt) : "",
    o.drNumber || "",
    o.bttNumber || "",
    o.totalBilled || total,
    o.drDocUrl || ""
  ];
}

function writeOrderSeq_(ss, val) {
  var sh = getOrCreateSheet_(ss, META_TAB);
  var vals = sh.getDataRange().getValues();
  for (var i = 0; i < vals.length; i++) {
    if (vals[i][0] === "orderSeq") { sh.getRange(i + 1, 2).setValue(val); return; }
  }
  sh.appendRow(["orderSeq", val]);
}

/* ---------- AVAILABILITY RELEASE CHECK ----------
   Mirrors checkAvailabilityReleases()/releaseItem() in script.js: any item
   marked "production" whose etaDate has arrived is split into a new ticket
   that goes straight to Preparation, and the event is logged. */
function checkReleases() {
  var lock = LockService.getScriptLock();
  var haveLock = false;
  try { lock.waitLock(20000); haveLock = true; } catch (e) {}
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var orders = readTab_(ss, TABS.orders.name);
    var log = readTab_(ss, TABS.availabilityLog.name);
    var seq = readOrderSeq_(ss);
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    var released = 0;

    orders.slice().forEach(function (o) {
      (o.items || []).forEach(function (item) {
        if (item.avail === "production" && item.etaDate && !item.released && item.etaDate <= today) {
          var id = "TCK-2026-" + ("0000" + seq++).slice(-4);
          var now = Date.now();
          item.released = true;
          item.avail = "released";
          item.releasedTo = id;
          orders.push({
            id: id, batchId: (o.batchId || o.id) + "-R", segment: o.segment, deliveryType: o.deliveryType || "A",
            userEmail: o.userEmail, userName: o.userName, userPosition: o.userPosition,
            township: o.township,
            items: [{ itemId: item.itemId, name: item.name, segment: item.segment, rate: item.rate, oum: item.oum, qty: item.qty, avail: "available" }],
            status: "preparation", createdAt: now, confirmedAt: now, ackAt: now, prepStatus: "ongoing", prepDoneAt: null,
            drNumber: null, iomNumber: null, bttNumber: null, noBtt: false, vehicleId: null, deliveryDate: null, bttAt: null,
            drAt: null, customerConfirmedAt: null, releaseAt: null, feeBreakdown: null, totalBilled: 0, deliveredAt: null,
            late: false, recurring: false, cycleCount: 1,
            adminRemark: "Auto-released from " + o.id + " — item became available on " + item.etaDate + ".",
            parentTicket: o.id
          });
          log.push({
            id: "AVL-" + now + "-" + Math.floor(Math.random() * 1000), ts: now,
            orderId: o.id, newTicketId: id, itemName: item.name, qty: item.qty,
            township: o.township, segment: o.segment, userEmail: o.userEmail, result: "available"
          });
          released++;
        }
      });
    });

    if (released) {
      writeTab_(ss, "orders", orders);
      writeTab_(ss, "availabilityLog", log);
      writeOrderSeq_(ss, seq);
    }
    return released;
  } finally {
    if (haveLock) { try { lock.releaseLock(); } catch (x) {} }
  }
}

/* ---------- IMAGE UPLOAD (Google Drive) ----------
   Files go into a Drive folder called "CGS Central Images" (created on first
   upload; its ID is remembered in Script Properties). Each file is shared as
   "anyone with the link can view" so the app can display it. Returns:
     url     -> embeddable thumbnail link (used as <img src> in the app)
     viewUrl -> normal Drive link (shown in the Sheet's Catalog tab)        */
function uploadImage_(b) {
  if (!b.data) throw new Error("No image data received.");
  var mime = b.mimeType || "image/jpeg";
  if (!/^image\//.test(mime)) throw new Error("Only image files are allowed.");
  var bytes = Utilities.base64Decode(b.data);
  if (bytes.length > 8 * 1024 * 1024) throw new Error("Image is too large (max 8 MB).");
  var safe = String(b.fileName || "image.jpg").replace(/[^\w.\- ]+/g, "_").slice(0, 80);
  var blob = Utilities.newBlob(bytes, mime, Date.now() + "-" + safe);
  var file = getImageFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var id = file.getId();
  return {
    fileId: id,
    url: "https://drive.google.com/thumbnail?id=" + id + "&sz=w1000",
    viewUrl: "https://drive.google.com/file/d/" + id + "/view"
  };
}

function getImageFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("IMAGE_FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* folder deleted; recreate */ } }
  var folder = DriveApp.createFolder("CGS Central Images");
  props.setProperty("IMAGE_FOLDER_ID", folder.getId());
  return folder;
}

function headersFor_(key) {
  var base = ["ID", "JSON"];
  if (key === "orders") return base.concat(["Status", "Segment", "Township", "Ordered by", "Created", "DR #", "BTT #", "Total billed", "DR Google Doc"]);
  if (key === "townships") return base.concat(["Name on DR", "Address"]);
  if (key === "users") return ["Email", "JSON", "Name", "Position", "Role", "Project", "Registered"];
  if (key === "catalog") return base.concat(["Item", "Segment", "Rate", "OUM", "Stock", "Image link (Drive)"]);
  return base;
}

function catalogSummary_(it) {
  return [it.name || "", it.segment || "", it.rate || 0, it.oum || "", it.stock || 0, it.imageView || ""];
}

/* ---------- DELIVERY RECEIPT (Google Doc) ----------
   Layout follows 2026_Delivery_Receipts.docx: Letter, 1" margins, Poppins 8pt,
   blank space at the top (pre-printed form), township + date, address, ITEM /
   DESCRIPTION / QUANTITY / UNIT / COMPLETE-PARTIAL table, BTT + IOM lines under
   DESCRIPTION, then the signature block at the bottom.
   The client sends everything to print in `dr`, so this never reads your Sheet. */
function createDR_(dr) {
  if (!dr || !dr.drNumber) throw new Error("Missing DR number.");
  var items = dr.items || [];
  if (!items.length) throw new Error("This DR has no available items to list.");

  var doc = DocumentApp.create(dr.drNumber + " - " + (dr.township || ""));
  var body = doc.getBody();
  body.clear();
  body.setPageWidth(612).setPageHeight(792)
      .setMarginTop(72).setMarginBottom(72).setMarginLeft(72).setMarginRight(72);

  // blank top area (letterhead space on the pre-printed form)
  var first = body.getChild(0).asParagraph();
  first.setText(" "); first.setAttributes(drStyle_(9, false));
  for (var s = 0; s < 6; s++) drPara_(body, " ", 9, false);

  // township (left) + date (right)
  var head = drTable_(body, [[dr.township || "", dr.date || ""]], [348, 120], 8, false);
  head.getRow(0).getCell(1).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  drPara_(body, " ", 8, false);
  drPara_(body, dr.address || "", 8, false);
  for (var g = 0; g < 3; g++) drPara_(body, " ", 8, false);

  // items table
  var rows = [["ITEM", "DESCRIPTION", "QUANTITY", "UNIT", "COMPLETE/PARTIAL"], ["", "", "", "", ""]];
  items.forEach(function (it, i) {
    rows.push([String(i + 1), it.name || "", String(it.qty), it.unit || "", it.status || "COMPLETE"]);
  });
  var tbl = drTable_(body, rows, [72, 144, 72, 72, 108], 8, false);
  for (var c = 0; c < 5; c++) tbl.getRow(0).getCell(c).getChild(0).asParagraph().setBold(true);

  // BTT / IOM under DESCRIPTION
  drPara_(body, " ", 8, false);
  drPara_(body, " ", 8, false);
  if (dr.bttNumber) drPara_(body, "BTT No. " + stripPrefix_(dr.bttNumber, "BTT"), 8, false).setIndentStart(72).setIndentFirstLine(72);
  if (dr.iomNumber) drPara_(body, "IOM NO. " + stripPrefix_(dr.iomNumber, "IOM"), 8, false).setIndentStart(72).setIndentFirstLine(72);

  // keep the signature block roughly where the original form has it
  var gap = Math.max(3, 12 - items.length);
  for (var k = 0; k < gap; k++) drPara_(body, " ", 8, false);

  // signature block
  var sig = drTable_(body, [
    ["", "", ""],
    ["CHECKED AND APPROVED BY:", "RELEASED BY:", "RECEIVED THE ABOVE ITEMS IN GOOD CONDITION"],
    ["", "", ""],
    ["", "", "SIGNATURE OVER PRINTED NAME"],
    ["", "", "DATE"]
  ], [130, 90, 248], 8, false);
  for (var b = 0; b < 3; b++) sig.getRow(1).getCell(b).getChild(0).asParagraph().setBold(true);
  sig.getRow(3).getCell(2).getChild(0).asParagraph().setBold(true);
  sig.getRow(4).getCell(2).getChild(0).asParagraph().setBold(true);
  sig.getRow(0).setMinimumHeight(44);
  sig.getRow(0).getCell(0).setVerticalAlignment(DocumentApp.VerticalAlignment.BOTTOM);
  sig.getRow(0).getCell(1).setVerticalAlignment(DocumentApp.VerticalAlignment.BOTTOM);
  sig.getRow(2).setMinimumHeight(26);
  addSignature_(sig.getRow(0).getCell(0), DR_SETTINGS.approverSignatureFileId, 124, 32);
  addSignature_(sig.getRow(0).getCell(1), DR_SETTINGS.releaserSignatureFileId, 78, 39);

  // shrink the automatic trailing paragraph so it can't push a blank 2nd page
  var last = body.getChild(body.getNumChildren() - 1);
  if (last.getType() === DocumentApp.ElementType.PARAGRAPH) last.asParagraph().setAttributes(drStyle_(1, false));

  doc.saveAndClose();
  var file = DriveApp.getFileById(doc.getId());
  file.moveTo(getDRFolder_(true));
  if (DR_SETTINGS.shareWithLink) file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { docId: doc.getId(), url: "https://docs.google.com/document/d/" + doc.getId() + "/edit", name: file.getName() };
}

/* PDF bytes of a DR, so the app can pop the browser's print dialog straight away.
   Only files inside the DR folder can be fetched (this endpoint is public). */
function getDRPdf_(docId) {
  var folder = getDRFolder_(false);
  if (!docId || !folder) throw new Error("No DR document found.");
  var file = DriveApp.getFileById(docId);
  var ok = false, parents = file.getParents();
  while (parents.hasNext()) { if (parents.next().getId() === folder.getId()) ok = true; }
  if (!ok) throw new Error("That file is not a CGS DR.");
  var pdf = file.getAs(MimeType.PDF);
  return { base64: Utilities.base64Encode(pdf.getBytes()), name: file.getName() + ".pdf" };
}

function getDRFolder_(create) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("DR_FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* deleted; recreate below */ } }
  if (!create) return null;
  var folder = DriveApp.createFolder(DR_SETTINGS.folderName);
  props.setProperty("DR_FOLDER_ID", folder.getId());
  return folder;
}

function drStyle_(size, bold) {
  var st = {};
  st[DocumentApp.Attribute.FONT_FAMILY] = "Poppins";
  st[DocumentApp.Attribute.FONT_SIZE] = size;
  st[DocumentApp.Attribute.BOLD] = !!bold;
  st[DocumentApp.Attribute.LINE_SPACING] = 1;
  st[DocumentApp.Attribute.SPACING_BEFORE] = 0;
  st[DocumentApp.Attribute.SPACING_AFTER] = 0;
  st[DocumentApp.Attribute.FOREGROUND_COLOR] = "#000000";
  return st;
}
function drPara_(body, text, size, bold) {
  var p = body.appendParagraph(text || " ");
  p.setAttributes(drStyle_(size, bold));
  return p;
}
function drTable_(body, rows, widths, size, bold) {
  var safe = rows.map(function (r) { return r.map(function (c) { return c === "" ? " " : c; }); });
  var t = body.appendTable(safe);
  t.setBorderWidth(0);
  widths.forEach(function (w, i) { t.setColumnWidth(i, w); });
  for (var r = 0; r < t.getNumRows(); r++) {
    var row = t.getRow(r);
    for (var c = 0; c < row.getNumCells(); c++) {
      var cell = row.getCell(c);
      cell.setPaddingTop(0).setPaddingBottom(0).setPaddingLeft(0).setPaddingRight(4);
      cell.getChild(0).asParagraph().setAttributes(drStyle_(size, bold));
    }
  }
  return t;
}
function addSignature_(cell, fileId, w, h) {
  if (!fileId) return;
  try {
    var p = cell.getChild(0).asParagraph();
    p.clear();
    p.appendInlineImage(DriveApp.getFileById(fileId).getBlob()).setWidth(w).setHeight(h);
  } catch (e) { /* bad file ID: leave the space blank */ }
}
function stripPrefix_(v, prefix) {
  return String(v).replace(new RegExp("^" + prefix + "[-\\s.]*", "i"), "");
}

/* ---------- ACCOUNTS (Users tab) ----------
   Columns: Email | JSON | Name | Position | Role | Project | Registered.
   The JSON holds the full account, including the password HASH (never the
   plain password for accounts created by this version of the app). */
function registerUser_(u) {
  if (!u || !u.email || !u.name || !(u.passwordHash || u.password)) {
    return { ok: false, error: "Missing account details." };
  }
  var email = String(u.email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "That email address doesn't look right." };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var users = readUsers_(ss);
  var exists = users.some(function (x) { return String(x.email).toLowerCase() === email; });
  if (exists) return { ok: false, error: "An account with that email already exists." };

  var account = {
    name: String(u.name).trim(),
    position: String(u.position || "").trim(),
    email: email,
    role: "user",   // the server decides: nobody can register themselves as an admin
    project: /@megaworldcorp\.com$/.test(email) ? "megaworld" : "special",
    createdAt: Date.now()
  };
  if (u.passwordHash) account.passwordHash = String(u.passwordHash); else account.password = String(u.password);

  users.push(account);
  writeTab_(ss, "users", users);
  return { ok: true };
}

/* Reads the Users tab. The visible columns (Name, Position, Role, Project) win
   over the JSON, so the Sheet owner can edit them directly — e.g. type "admin"
   in the Role cell to promote someone. */
function readUsers_(ss) {
  var sh = ss.getSheetByName(TABS.users.name);
  if (!sh || sh.getLastRow() < 2) return [];
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
  var out = [];
  rows.forEach(function (r) {
    if (r[1] === "" || r[1] === null) return;
    var u;
    try { u = JSON.parse(r[1]); } catch (e) { return; }
    if (!u || !u.email) return;
    if (String(r[2]).trim()) u.name = String(r[2]).trim();
    if (String(r[3]).trim()) u.position = String(r[3]).trim();
    var role = String(r[4]).trim().toLowerCase();
    if (role === "admin" || role === "user") u.role = role;
    var project = String(r[5]).trim().toLowerCase();
    if (project === "megaworld" || project === "special") u.project = project;
    out.push(u);
  });
  return out;
}

/* Browsers may add or update accounts, but never change anyone's role/project:
   only the first-ever save (empty Users tab, used to seed the starter accounts)
   is accepted as-is. */
function mergeUsers_(existing, incoming) {
  var seeding = existing.length === 0;
  var byEmail = {}, order = [];
  function clone(o) { var c = {}; Object.keys(o).forEach(function (f) { c[f] = o[f]; }); return c; }
  existing.forEach(function (u) {
    var k = String(u.email).toLowerCase();
    byEmail[k] = u; order.push(k);
  });
  incoming.forEach(function (u) {
    if (!u || !u.email) return;
    var k = String(u.email).toLowerCase();
    var old = byEmail[k];
    if (!old) {
      var fresh = clone(u);
      if (!seeding) {
        fresh.role = "user";
        fresh.project = /@megaworldcorp\.com$/.test(k) ? "megaworld" : "special";
      }
      byEmail[k] = fresh; order.push(k);
      return;
    }
    var merged = clone(u);
    merged.role = old.role; merged.project = old.project;
    // never let an older copy with a plain password replace an upgraded hash
    if (old.passwordHash && !u.passwordHash) { merged.passwordHash = old.passwordHash; delete merged.password; }
    byEmail[k] = merged;
  });
  return order.map(function (k) { return byEmail[k]; });
}

function userSummary_(u) {
  return [u.name || "", u.position || "", u.role || "", u.project || "", u.createdAt ? new Date(u.createdAt) : ""];
}

/* ---------- HELPERS ---------- */
function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
