/* ==========================================================================
   CGS CENTRAL — Google Sheets backend connector
   --------------------------------------------------------------------------
   HOW TO CONNECT (one-time setup):
   1. Open the Google Sheet you want to use as the database (or create a
      blank one).
   2. In the Sheet, go to Extensions → Apps Script.
   3. Delete anything in the editor and paste the contents of
      "apps-script/Code.gs" (shipped alongside this file).
   4. Run the `setup` function once (▶ button, choose "setup" from the
      dropdown) and grant the permissions it asks for. This creates the
      Orders / Catalog / Vehicles / Users / Townships / AvailabilityLog
      tabs for you.
   5. Click Deploy → New deployment → type "Web app".
        - Execute as: Me
        - Who has access: Anyone
      Deploy, then copy the Web App URL it gives you
      (ends in /exec).
   6. Paste that URL into config.js (WEB_APP_URL). Reload index.html.

   Until WEB_APP_URL is filled in (config.js), the app runs on local, in-memory demo
   data only (nothing is saved between reloads) — exactly like the
   original prototype.

   Data model: rather than mapping every field to its own spreadsheet
   column (fragile as the app evolves), each tab stores one JSON object
   per row (ID in column A, JSON payload in column B). This keeps the
   Apps Script side tiny and means new fields in script.js never require
   a spreadsheet migration. If you'd rather browse "real" columns in the
   Sheet UI, see the note in Code.gs about switching to column mapping.
   ========================================================================== */

const CGS_SHEETS = {
  // The Web App URL now lives in config.js (so each Vercel environment can point at its own Sheet).
  WEB_APP_URL: (window.CGS_CONFIG && window.CGS_CONFIG.WEB_APP_URL) || "",

  loaded: false,        // true once the Sheet has been read; saves stay blocked until then so a failed load can never overwrite it
  status: "idle",       // "idle" | "saving" | "saved" | "error"  (shown as the little dot in the top bar)
  onStatus: null,
  _timer: null, _prefetch: null, _getPayload: null,
  _base: null,          // what the Sheet is known to hold: { tab: { id: "json" } } — saves send only the difference
  _saving: false, _again: false, _pending: false, _failures: 0,
  SAVE_DELAY_MS: 700,
  TAB_KEYS: { orders:"id", catalog:"id", vehicles:"id", availabilityLog:"id", townships:"name" },
  MAX_REMOVE: 25,

  enabled(){ return !!this.WEB_APP_URL; },
  _setStatus(s){ this.status = s; if(typeof this.onStatus === "function") this.onStatus(s); },

  /* ---------- reading ---------- */
  token: null,            // set at sign-in; every request carries it
  companies: null,        // public list for the sign-up drop-down: [{id, name, status}]
  canWrite: {},           // which tabs this person's role may save (the server enforces it too)
  WRITABLE: { admin:["orders","catalog","vehicles","availabilityLog","townships"], user:["orders","catalog","availabilityLog"],
              approver1:["orders"], approver2:["orders"] },

  /* The Sheet's data now comes WITH the sign-in answer, filtered for this person's role.
     ingest() records what the Sheet holds so later saves can send only the differences. */
  dataVersion: null,       // the Sheet's change counter as of the last time we looked
  ingest(data, role){
    this.loaded = true;
    this.dataVersion = data.version != null ? data.version : null;
    this._setBase(data);
    this.canWrite = {};
    (this.WRITABLE[role] || []).forEach(t=>{ this.canWrite[t] = true; });
  },
  /* Re-reads this person's data (used after the server refuses a change). */
  async loadAll(){
    if(!this.enabled() || !this.token) return null;
    try{
      const res = await fetch(this.WEB_APP_URL + "?action=loadAll&token=" + encodeURIComponent(this.token), { method:"GET" });
      if(!res.ok) throw new Error("HTTP " + res.status);
      const out = await res.json();
      if(!out || !out.ok) throw new Error((out && out.error) || "unknown error");
      return out.data;
    }catch(err){ console.warn("CGS Sheets: could not reload.", err); return null; }
  },
  /* Company names for the sign-up form. Starts at page load; no sign-in needed. */
  prefetchCompanies(){
    if(!this.enabled() || this._companiesP) return this._companiesP;
    this._companiesP = fetch(this.WEB_APP_URL + "?action=listCompanies").then(r=>r.json())
      .then(o=>{ this.companies = (o && o.ok) ? o.companies : []; return this.companies; })
      .catch(()=>{ this._companiesP = null; return []; });
    return this._companiesP;
  },
  refreshCompanies(){ this._companiesP = null; return this.prefetchCompanies(); },

  /* ---------- fast saving: only what changed ---------- */
  _idOf(tab, it){ const k = this.TAB_KEYS[tab]; return String(typeof it === "string" ? it : it[k]); },
  _setBase(data){
    const base = { orderSeq: data.orderSeq };
    Object.keys(this.TAB_KEYS).forEach(tab=>{
      const m = {};
      (data[tab] || []).forEach(it=>{ m[this._idOf(tab, it)] = JSON.stringify(typeof it === "string" ? { name: it } : it); });
      base[tab] = m;
    });
    this._base = base;
  },
  _diff(payload){
    const changes = {}, next = { orderSeq: payload.orderSeq };
    let n = 0;
    Object.keys(this.TAB_KEYS).forEach(tab=>{
      const items = payload[tab];
      if(!this.canWrite[tab] || !Array.isArray(items)){ next[tab] = this._base[tab] || {}; return; }
      const before = this._base[tab] || {}, seen = {}, upsert = [];
      items.forEach(it=>{
        const id = this._idOf(tab, it), js = JSON.stringify(it);
        seen[id] = js;
        if(before[id] !== js) upsert.push(it);
      });
      let remove = Object.keys(before).filter(id=>!(id in seen));
      if(remove.length > this.MAX_REMOVE || (remove.length > 3 && remove.length > Object.keys(before).length * 0.25)){
        console.warn("CGS Sheets: refusing to delete " + remove.length + " " + tab + " rows in one save — looks like a bug, not an edit.");
        remove.forEach(id=>{ seen[id] = before[id]; });   // pretend they're still there
        remove = [];
      }
      next[tab] = seen;
      if(upsert.length || remove.length){ changes[tab] = { upsert, remove }; n += upsert.length + remove.length; }
    });
    const seqChanged = payload.orderSeq != null && payload.orderSeq !== this._base.orderSeq && !!this.token;
    return { changes, next, n, seqChanged };
  },

  /* Debounced: call on every render(); a burst of clicks becomes one small write. */
  scheduleSave(getPayloadFn){
    if(!this.enabled() || !this.loaded) return;
    this._getPayload = getPayloadFn;
    this._pending = true;
    clearTimeout(this._timer);
    this._timer = setTimeout(()=>this._flush(), this.SAVE_DELAY_MS);
  },
  async saveNow(getPayloadFn){
    if(!this.enabled() || !this.loaded) return;
    this._getPayload = getPayloadFn;
    clearTimeout(this._timer);
    while(this._saving) await new Promise(r=>setTimeout(r, 80));   // let a save already under way finish first
    await this._flush();
  },
  async _flush(){
    if(!this.loaded || !this._getPayload) return;
    if(this._saving){ this._again = true; return; }
    const payload = this._getPayload();
    const d = this._diff(payload);
    if(!d.n && !d.seqChanged){ this._pending = false; if(this.status === "saving") this._setStatus("saved"); return; }
    this._saving = true; this._setStatus("saving");
    try{
      const res = await this._request({ action:"saveDelta", changes:d.changes, orderSeq:payload.orderSeq });
      this._base = d.next;           // only now do we treat these rows as saved
      // if nobody else saved in between, our own save is the only change: don't treat it as "something new" later
      if(res.version != null && this.dataVersion != null && res.version === this.dataVersion + 1) this.dataVersion = res.version;
      if(res.denied && typeof this.onDenied === "function") this.onDenied(res.denied);
      this._failures = 0;
      if(!this._again) this._pending = false;
      this._setStatus("saved");
    }catch(err){
      this._failures++;
      this._setStatus("error");
      console.warn("CGS Sheets: save failed, will retry.", err);
      clearTimeout(this._retry);
      this._retry = setTimeout(()=>this._flush(), Math.min(30000, 2000 * Math.pow(2, this._failures)));
    }finally{
      this._saving = false;
      if(this._again){ this._again = false; this._flush(); }
    }
  },
  /* Called when the tab is being closed or hidden: send anything unsaved with a
     beacon, which the browser delivers even while the page is going away. */
  _beacon(){
    if(!this.loaded || !this._getPayload || !(this._pending || this._saving) || !navigator.sendBeacon) return;
    try{
      const payload = this._getPayload(), d = this._diff(payload);
      if(!d.n && !d.seqChanged) return;
      const body = JSON.stringify({ action:"saveDelta", token:this.token, changes:d.changes, orderSeq:payload.orderSeq });
      if(body.length < 60000) navigator.sendBeacon(this.WEB_APP_URL, new Blob([body], { type:"text/plain;charset=UTF-8" }));
    }catch(e){}
  },

  /* POST that expects { ok:true, ... } back. text/plain avoids a CORS preflight
     (Apps Script Web Apps don't answer OPTIONS requests). */
  async _request(body){
    if(!this.enabled()) throw new Error("Connect Google Sheets first (set WEB_APP_URL in config.js).");
    if(this.token && body.token === undefined) body.token = this.token;
    const res = await fetch(this.WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    });
    if(!res.ok) throw new Error("HTTP " + res.status);
    const out = await res.json();
    if(!out || !out.ok) throw new Error((out && out.error) || "Request failed");
    return out;
  },

  /* Uploads one image file to Google Drive via the Apps Script backend.
     The image is shrunk in the browser first (max 900px, JPEG) so uploads
     are fast and Drive doesn't fill up with 8 MB phone photos.
     Resolves to { fileId, url, viewUrl }:
       url     -> direct, embeddable link (use this as <img src>)
       viewUrl -> the normal Drive "open file" link (stored in the Sheet)   */
  async uploadImage(file){
    if(!this.enabled()) throw new Error("Connect Google Sheets first (set WEB_APP_URL in config.js).");
    if(!file || !/^image\//.test(file.type)) throw new Error("Please choose an image file.");
    const { base64, mimeType } = await this._compressImage(file);
    return this._request({ action:"uploadImage", fileName:file.name.replace(/\.[^.]+$/, "") + ".jpg", mimeType, data: base64 });
  },

  _compressImage(file, maxDim = 900, quality = 0.82){
    return new Promise((resolve, reject)=>{
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = ()=>{
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); // flatten transparency for JPEG
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve({ base64: c.toDataURL("image/jpeg", quality).split(",")[1], mimeType: "image/jpeg" });
      };
      img.onerror = ()=>{ URL.revokeObjectURL(url); reject(new Error("Could not read that image file.")); };
      img.src = url;
    });
  },

  /* Creates the Delivery Receipt as a Google Doc. Resolves to { docId, url, name }. */
  createDR(dr){ return this._request({ action:"createDR", dr }); },

  /* Fetches the DR as a PDF and opens the browser's print dialog right away. */
  async printDR(docId){
    const out = await this._request({ action:"getDRPdf", docId });
    const bytes = Uint8Array.from(atob(out.base64), c=>c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type:"application/pdf" }));
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    frame.src = url;
    frame.onload = ()=>{
      try{ frame.contentWindow.focus(); frame.contentWindow.print(); }
      catch(e){ window.open(url, "_blank"); }   // fallback: open the PDF in a tab
      setTimeout(()=>{ frame.remove(); URL.revokeObjectURL(url); }, 120000);
    };
    document.body.appendChild(frame);
  },

  /* Ticket numbers come from the server so two devices can never pick the same one. */
  async reserveSeq(count){ const r = await this._request({ action:"reserveSeq", count }); return r.start; },
  /* Has anything in the Sheet changed since we last looked? (one tiny request) */
  async version(){
    const res = await fetch(this.WEB_APP_URL + "?action=version&token=" + encodeURIComponent(this.token), { method:"GET" });
    const out = await res.json();
    if(!out || !out.ok) throw new Error((out && out.error) || "version check failed");
    return out.version;
  },

  /* ---- Special Projects ---- */
  fileToBase64(file){
    return new Promise((resolve, reject)=>{
      const r = new FileReader();
      r.onload = ()=>resolve(String(r.result).split(",")[1] || "");
      r.onerror = ()=>reject(new Error("Couldn't read that file."));
      r.readAsDataURL(file);
    });
  },
  registerCompany(c){ return this._request({ action:"registerCompany", ...c }); },
  adminCompanies(){ return this._request({ action:"adminCompanies" }).then(o=>o.companies || []); },
  companyPdf(id){ return this._request({ action:"companyPdf", id }); },
  reviewCompany(id, decision, note){ return this._request({ action:"reviewCompany", id, decision, note }); },
  setRole(email, role){ return this._request({ action:"setRole", email, role }); },
  createStaff(s){ return this._request({ action:"createStaff", ...s }); },
  uploadSignedCp(orderId, fileName, data){ return this._request({ action:"uploadSignedCp", orderId, fileName, data }); },
  getSignedCp(orderId){ return this._request({ action:"getSignedCp", orderId }); },
  uploadReceipt(orderId, fileName, data){ return this._request({ action:"uploadReceipt", orderId, fileName, data }); },
  getReceipt(orderId, fileId){ return this._request({ action:"getReceipt", orderId, fileId }); },
  notify(orderId, kind){ return this._request({ action:"notify", orderId, kind }).catch(()=>null); },

  /* Records a new account in the Users tab right away (server checks for duplicates). */
  /* ---- accounts (checked by the Apps Script server; no password is ever stored in the Sheet or here) ----
     token = the sign-in token the server hands back; it's sent with admin-only requests. */
  token: null,
  /* -> { user, token } or { mustChangePassword:true, user } (temporary password) */
  login(email, password, remember){ return this._request({ action:"login", email, password, remember: !!remember }); },
  registerUser(user, password, remember){ return this._request({ action:"registerUser", user, password, remember: !!remember }); },
  /* Used after a temporary password: -> { user, token } */
  changePassword(email, currentPassword, newPassword, remember){
    return this._request({ action:"changePassword", email, currentPassword, newPassword, remember: !!remember });
  },
  /* Re-checks a remembered token -> { user } (throws if it expired) */
  validateSession(token){ return this._request({ action:"validateSession", token }); },
  /* Admin only */
  async listAccounts(){ const out = await this._request({ action:"listAccounts", token:this.token }); return out.users || []; },
  /* Admin only -> { email, tempPassword } */
  resetPassword(email){ return this._request({ action:"resetPassword", token:this.token, email }); },

  /* Ask the backend to run its release check immediately (in addition to
     the daily time-driven trigger in Code.gs), useful right after an
     admin sets/changes an ETA date. Best-effort — the client already
     runs the same check locally so the UI is correct either way. */
  pokeReleaseCheck(){
    if(!this.enabled()) return;
    this._request({ action:"checkReleases" }).catch(()=>{});
  }
};

/* start reading the Sheet right away, and save anything pending if the tab is closed */
CGS_SHEETS.prefetchCompanies();
window.addEventListener("pagehide", ()=>CGS_SHEETS._beacon());
document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState === "hidden") CGS_SHEETS._beacon(); });
