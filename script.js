/* ==========================================================================
   CGS CENTRAL — prototype application logic
   In-memory state only (no live backend). Built to demonstrate the full
   order-to-delivery lifecycle, billing rules and reporting described in the
   CGS automation brief. See the "LIMITATIONS" note near the bottom for what
   would need real wiring (Google Sheets, auth, email) in production.
   ========================================================================== */

/* ---------------------------- CATALOG DATA ------------------------------- */
/* [segment, name, rate, oum] — sourced from the CGS items & pricing sheet.
   Two segments used only for delivery-type classification in the brief
   (Tree Seedlings, Tissue Culture Ornamental Plants) had no rows in the
   sheet, so a couple of placeholder items were added — edit freely in
   Items & Pricing. */
const RAW_ITEMS = [
  ["SIGNAGES","Traffic & Special Signages w/o GI Sheet",350.00,"pc"],
  ["SIGNAGES","Traffic & Special Signages w/GI Sheet",600.00,"pc"],
  ["SIGNAGES","Concrete Footing (5.5ft)",1200.00,"pc"],
  ["SIGNAGES","A-Frame (3ft x 3ft)",6050.00,"pc"],
  ["SIGNAGES","A-Frame (3ft x 8ft)",8000.00,"pc"],
  ["SIGNAGES","A-Frame (3ft x 10ft)",11509.96,"pc"],
  ["SIGNAGES","A-Frame (3ft x 12ft)",23019.84,"pc"],
  ["SIGNAGES","Double Face (2ft x 4ft) w/Base Plate & Footing",6050.00,"pc"],
  ["SIGNAGES","Pedestrian Signages (2ft x 4ft)",6050.00,"pc"],
  ["SIGNAGES","Chevron (1ft x .50ft)",6050.00,"pc"],
  ["SIGNAGES","Street Name (1ft x 4ft)",3904.00,"pc"],
  ["SIGNAGES","Directional Signage (2ft x 6ft)",9849.60,"pc"],
  ["SIGNAGES","Directional Signage (3ft x 6ft)",14072.40,"pc"],
  ["SIGNAGES","Directional Signage (4ft x 6ft)",18759.60,"pc"],
  ["SIGNAGES","Directional Signage (6ft x 6ft)",25536.60,"pc"],
  ["SIGNAGES","Meow Spot (1ft x 2ft)",1621.40,"pc"],
  ["BANNERS","Regular Banner - 12oz",60.00,"sqft"],
  ["BANNERS","Wind Resistant Banner",70.00,"sqft"],
  ["BANNERS","Vinyl Sticker",155.00,"sqft"],
  ["BANNERS","Sintra Diecut",220.00,"sqft"],
  ["BANNERS","Sintra Diecut with Sticker",375.00,"sqft"],
  ["TREES","African Tulip",3560.00,"pc"],
  ["TREES","Ilang-Ilang",3560.00,"pc"],
  ["TREES","Golden Shower",3560.00,"pc"],
  ["TREES","Bani",3560.00,"pc"],
  ["TREES","Alibangbang",3560.00,"pc"],
  ["TREES","Palawan Cherry",3560.00,"pc"],
  ["TREES","Banaba",3560.00,"pc"],
  ["TREES","Knife Acacia",3560.00,"pc"],
  ["TREES","Tabebuia",3560.00,"pc"],
  ["TREES","Narra",3560.00,"pc"],
  ["TREES","Acacia",3560.00,"pc"],
  ["TREES","Copper Pod",3560.00,"pc"],
  ["TREES","Dita",3560.00,"pc"],
  ["TREES","White Champaca",3560.00,"pc"],
  ["TREES","Salimbobog",3560.00,"pc"],
  ["TREES","Foxtail Palm",3560.00,"pc"],
  ["TREES","Date Palm",8385.00,"pc"],
  ["TREES","5ft below Conocarpus",1000.00,"pc"],
  ["TREES","5ft below Tabebuia",1000.00,"pc"],
  ["TREES","5ft below Banaba",1000.00,"pc"],
  ["TREES","5ft below Palawan Cherry",1000.00,"pc"],
  ["TREES","Variegated Hibiscus Tree",3560.00,"pc"],
  ["TREES","Fire Tree",3560.00,"pc"],
  ["TREES","Kapok",3560.00,"pc"],
  ["SHRUBS","Red Acalypha",40.00,"pc"],
  ["SHRUBS","Bougainvillea",40.00,"pc"],
  ["SHRUBS","Black Stem Caricature",40.00,"pc"],
  ["SHRUBS","Red Caricature",40.00,"pc"],
  ["SHRUBS","Don Manuel",40.00,"pc"],
  ["SHRUBS","Golden Duranta",35.00,"pc"],
  ["SHRUBS","Golden Top Ficus",40.00,"pc"],
  ["SHRUBS","Green Pandakaki",40.00,"pc"],
  ["SHRUBS","Peanut Plant",30.00,"pc"],
  ["SHRUBS","Japanese Bush",35.00,"pc"],
  ["SHRUBS","Picarra",40.00,"pc"],
  ["SHRUBS","Purple Crumble",40.00,"pc"],
  ["SHRUBS","Yellow Candle",50.00,"pc"],
  ["SHRUBS","Yellow Bell",40.00,"pc"],
  ["SHRUBS","Kamuning",50.00,"pc"],
  ["SHRUBS","Conocarpus",50.00,"pc"],
  ["SHRUBS","Green Dust",50.00,"pc"],
  ["SHRUBS","Variegated Chinese Purple",40.00,"pc"],
  ["SHRUBS","Cuphea",35.00,"pc"],
  ["SHRUBS","Wild Petunia",40.00,"pc"],
  ["SHRUBS","Golden Pothos",35.00,"pc"],
  ["SHRUBS","Wedelia",35.00,"pc"],
  ["SHRUBS","Monaica",50.00,"pc"],
  ["SHRUBS","Agave",65.00,"pc"],
  ["SHRUBS","Eugenia",50.00,"pc"],
  ["SHRUBS","Golden Miagos",50.00,"pc"],
  ["SHRUBS","Podocarpus Maki",65.00,"pc"],
  ["SHRUBS","Hongkong Schefflera",40.00,"pc"],
  ["SHRUBS","Purple Prince",40.00,"pc"],
  ["SHRUBS","Heliconia",130.00,"pc"],
  ["SHRUBS","Sanchezia",50.00,"pc"],
  ["SHRUBS","Ti Plant",65.00,"pc"],
  ["SHRUBS","Guzmania Cherry",165.00,"pc"],
  ["SHRUBS","Guzmania Marjan",165.00,"pc"],
  ["SHRUBS","Guzmania Mathilda",165.00,"pc"],
  ["SHRUBS","Guzmania Candy",165.00,"pc"],
  ["SHRUBS","Guzmania Hope",165.00,"pc"],
  ["SHRUBS","Neoregelia Scandor",165.00,"pc"],
  ["SHRUBS","Neoregelia Maui",165.00,"pc"],
  ["SHRUBS","Neoregelia Galaxy",165.00,"pc"],
  ["SHRUBS","Monaica Plant (1ft)",80.00,"pc"],
  ["SHRUBS","Podocarpus Maki (1ft)",160.00,"pc"],
  ["FLOWERS","Petunia",40.00,"pc"],
  ["FLOWERS","Torenia",40.00,"pc"],
  ["FLOWERS","Sunflower",50.00,"pc"],
  ["FLOWERS","Dianthus",50.00,"pc"],
  ["FLOWERS","Poinsettia",240.00,"pc"],
  ["TREE SEEDLINGS","Assorted Seedling Tray (25pc)",850.00,"tray"],
  ["TREE SEEDLINGS","Narra Seedling (bare root)",65.00,"pc"],
  ["TISSUE CULTURE ORNAMENTAL PLANTS","Tissue-Cultured Anthurium",180.00,"pc"],
  ["TISSUE CULTURE ORNAMENTAL PLANTS","Tissue-Cultured Philodendron",220.00,"pc"],
  ["THERMOPLASTICS","White Normal Thermoplastic Paint",846.00,"sqm"],
  ["THERMOPLASTICS","Yellow Normal Thermoplastic Paint",954.00,"sqm"],
  ["THERMOPLASTICS","White Markers Thermoplastic Paint",1814.75,"sqm"],
  ["THERMOPLASTICS","Yellow Markers Thermoplastic Paint",1922.75,"sqm"],
  ["THERMOPLASTICS","Complete Asphalt Works",1500.00,"sqm"],
  ["THERMOPLASTICS","Labor Asphalt Works",672.00,"sqm"],
];

let CATALOG = RAW_ITEMS.map((r,i)=>({
  id: "ITM-"+String(i+1).padStart(3,"0"),
  segment:r[0], name:r[1], rate:r[2], oum:r[3], stock: 20 + (i*7)%60, image:null
}));

const TOWNSHIPS = [
  "Arcovia City Estate Association, Inc.","Boracay New Coast Estate Association",
  "Capital Town Association, Inc.","Citylink Coach Services, Inc.",
  "Davao Park District Association, Inc.","Global-Estate Resort, Inc.",
  "Iloilo Business Park Estate Association","Integrated Town Management Corp.",
  "Lourdes T. Gutierrez-Alfonso","Maple Grove Estate Association",
  "Mckinley Town Center Estate Association","Mckinley West Estate Association",
  "Megawide Construction Corp.","Megaworld Corporation","Newport City Estate Association",
  "Northill Gateway Estate Association","Southwoods City Estate Association",
  "The Mactan Newtown Estate Association","The Upper East Estate Association",
  "Twin Lakes Estate Association","Uptown Bonifacio Estate Association",
  "Westside City Estate Association"
];

/* Estate addresses. legalName = how the township is printed on the DR.
   Matched to the TOWNSHIPS names above by townshipKey(), so "Twin Lakes Estate
   Commercial Association, Inc." finds "Twin Lakes Estate Association". */
const TOWNSHIP_SEED = [
  {legalName:"Mckinley Town Center Estate Association", address:"G/F McKinley Parking Building North Road Brgy. Pinagsama Taguig City"},
  {legalName:"Mckinley West Estate Association Inc.", address:"G/F McKinley Parking Building North Road Brgy. Pinagsama Taguig City"},
  {legalName:"Uptown Bonifacio Estate Association Inc.", address:"25th Floor Alliance Global Tower 36th Street corner 11th Avenue Uptown Bonifacio Taguig City"},
  {legalName:"Newport City Estate Association", address:"N150 Building Newport Blvd. Newport Pasay City"},
  {legalName:"Arcovia City Estate Association Inc.", address:"99 Eulogio Rodriguez Ugong Pasig City"},
  {legalName:"Maple Grove Estate Association Inc.", address:"Antero Soriano Highway, General Trias, Cavite"},
  {legalName:"Capital Town Estate Association, Inc.", address:"711 Capitol Blvd, San Fernando, 2000 Pampanga"},
  {legalName:"Southwoods City Estate Association", address:"Manila Southwoods Sports Club Cabiling Baybay Carmona Cavite"},
  {legalName:"Westside City Estate Association, Inc.", address:"Parañaque, Metro Manila"},
  {legalName:"Twin Lakes Estate Commercial Association, Inc.", address:"Tagaytay - Nasugbu Highway, Laurel, Batangas"},
  {legalName:"Boracay Newcoast Federation Inc.", address:"Newcoast Drive Brgy. Yapak Boracay Malay Aklan"},
  {legalName:"Citylink Coach Services Inc.", address:"Ground Floor Parking Bldg. McKinley Town Center Bonifacio Global City"},
  {legalName:"Megaworld Corporation", address:"Alliance Global Tower 36th Street corner 11th Avenue Uptown Bonifacio Taguig City"}
];
function townshipKey(n){
  return String(n||"").toLowerCase().replace(/[^a-z0-9 ]/g,"")
    .replace(/\b(inc|association|estate|commercial|federation)\b/g,"").replace(/\s+/g,"");
}
function escAttr(v){ return String(v==null?"":v).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }

/* Delivery-type classification (per the billing rules in the brief) */
const SEGMENT_TYPE = {
  SIGNAGES:"A", BANNERS:"A", TREES:"A", SHRUBS:"A", FLOWERS:"A",
  "TREE SEEDLINGS":"A", "TISSUE CULTURE ORNAMENTAL PLANTS":"A",
  THERMOPLASTICS:"B"
};
const ALL_SEGMENTS = Object.keys(SEGMENT_TYPE);

const SEGMENT_COLORS = {
  SIGNAGES:{bg:"#fdf1cf",fg:"#b57e21"}, BANNERS:{bg:"#e6eefc",fg:"#2255a8"},
  TREES:{bg:"#e2f0e0",fg:"#1c4a32"}, SHRUBS:{bg:"#eaf3e2",fg:"#4f8f5b"},
  FLOWERS:{bg:"#fbe7ef",fg:"#b5457f"}, THERMOPLASTICS:{bg:"#f1f1ea",fg:"#4b5a4f"},
  "TREE SEEDLINGS":{bg:"#e9f2e6",fg:"#2f6b3f"}, "TISSUE CULTURE ORNAMENTAL PLANTS":{bg:"#eef2e2",fg:"#5c7a3a"}
};
const SEGMENT_ICON = {
  SIGNAGES:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2 3 20h18L12 2Z"/><path d="M12 10v4M12 17h.01"/></svg>',
  BANNERS:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 3v18M4 4h15l-3 4 3 4H4"/></svg>',
  TREES:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2 6 11h3l-4 6h5v5h4v-5h5l-4-6h3L12 2Z"/></svg>',
  SHRUBS:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 22v-6M8 22h8M7 12a5 5 0 0 1 5-6 5 5 0 0 1 5 6 5 5 0 0 1-10 0Z"/></svg>',
  FLOWERS:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="12" r="2.4"/><circle cx="12" cy="5.5" r="3"/><circle cx="18.5" cy="12" r="3"/><circle cx="12" cy="18.5" r="3"/><circle cx="5.5" cy="12" r="3"/><path d="M12 16v5"/></svg>',
  THERMOPLASTICS:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 17h18M6 17V9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v8M9 21h6"/></svg>',
  "TREE SEEDLINGS":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3v6M8 9l4-6 4 6M6 21c0-5 3-8 6-8s6 3 6 8"/></svg>',
  "TISSUE CULTURE ORNAMENTAL PLANTS":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="5" y="4" width="14" height="10" rx="2"/><path d="M12 14v6M9 20h6"/></svg>'
};
function thumbHTML(segment){
  const c = SEGMENT_COLORS[segment]||{bg:"#eee",fg:"#333"};
  const svg = (SEGMENT_ICON[segment]||"").replace(/currentColor/g,c.fg);
  return `<div class="swatch" style="background:${c.bg}; color:${c.fg}">${svg}</div>`;
}
function itemImageHTML(it){
  if(it.image){ return `<img src="${it.image}" alt="${it.name}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;">`; }
  return thumbHTML(it.segment);
}

/* ---------------------------- FLEET --------------------------------------*/
let VEHICLES = [
  {id:"VEH-1", name:"Boom Truck 1 — Canter", plate:"NBC-1234", driver:"Rudy Santos"},
  {id:"VEH-2", name:"Boom Truck 2 — Elf NPR75", plate:"NDT-5521", driver:"Mark Villanueva"},
  {id:"VEH-3", name:"Flatbed — Fuso Canter", plate:"NFA-8890", driver:"Jun Reyes"},
  {id:"VEH-4", name:"Van — L300", plate:"NBW-2207", driver:"Ariel Cruz"},
];

/* ---------------------------- STAGES ------------------------------------- */
const STAGES = ["Ordered","Confirmed","Acknowledged","Prepared","BTT Assigned","For Delivery","Delivered"];
const STAGE_INDEX = { new:0, awaiting_ack:1, rejected:1, cancelled:1, preparation:2, ready_for_btt:3, ready_for_dr:4, for_delivery:5, delivered:6 };
const STATUS_LABEL = {
  sp_pricing:"For pricing", sp_revision:"For revision", sp_approver1:"With Approver 1", sp_approver2:"With Approver 2", sp_client:"Cost proposal sent",
  new:"New ticket", awaiting_ack:"Waiting for your approval", rejected:"Rejected", cancelled:"Cancelled",
  preparation:"In preparation", ready_for_btt:"Ready for BTT", ready_for_dr:"Ready for DR",
  for_delivery:"Out for delivery", delivered:"Delivered"
};
const STATUS_CLASS = {
  sp_pricing:"status-new", sp_revision:"status-wait", sp_approver1:"status-prep", sp_approver2:"status-prep", sp_client:"status-assigned",
  new:"status-new", awaiting_ack:"status-wait", rejected:"status-rejected", cancelled:"status-rejected",
  preparation:"status-prep", ready_for_btt:"status-progress", ready_for_dr:"status-assigned",
  for_delivery:"status-delivery", delivered:"status-delivered"
};

/* ---------------------------- STATE --------------------------------------*/
const state = {
  users: [
    {name:"Juana Dela Cruz", position:"Property Management Officer", email:"user@megaworldcorp.com", password:"demo", role:"user", project:"megaworld"},
    {name:"CGS Admin", position:"CGS Operations Head", email:"admin@megaworldcorp.com", password:"demo", role:"admin", project:"megaworld"},
  ],
  currentUser: null,
  cart: [], // {itemId, qty}
  spCart: [], // Special Projects cart: {lineId, itemId, qty, customization, note}
  spPayMode: "",
  companies: [], // admin only: company registrations (loaded from the Companies tab)
  orders: [], // tickets — one segment per ticket
  orderSeq: 1,
  townshipsList: [...TOWNSHIPS],
  townshipInfo: {}, // name -> {legalName, address}, persisted in the Townships tab
  deliveryLogs: [], // finalized BTT trips: {id, vehicleId, releaseAt, deliveredAt, bttNumber, tickets:[ids], feeTotal, breakdown, hours}
  availabilityLog: [], // history of items that came out of production or were marked unavailable
  notices: [], // {id, userEmail, seen, message, ticketId} — queued pop-ups for "your item is now available"
};

function townshipDetails(name){
  const own = state.townshipInfo[name];
  if(own && (own.address || own.legalName)){
    if(own.address) return { legalName: own.legalName || name, address: own.address };
  }
  const seed = TOWNSHIP_SEED.find(x=>townshipKey(x.legalName)===townshipKey(name));
  return { legalName: (own&&own.legalName) || (seed?seed.legalName:name), address: seed?seed.address:"" };
}
function ensureTownshipInfo(){
  state.townshipsList.forEach(n=>{
    const cur = state.townshipInfo[n] || (state.townshipInfo[n] = {legalName:"", address:""});
    const d = townshipDetails(n);
    if(!cur.address) cur.address = d.address;
    if(!cur.legalName) cur.legalName = d.legalName;
  });
}
function hydrateTownships(list){
  if(!Array.isArray(list) || !list.length) return;
  state.townshipsList = list.map(t=>typeof t==="string"?t:t.name);
  list.forEach(t=>{ if(t && typeof t==="object") state.townshipInfo[t.name] = { legalName:t.legalName||"", address:t.address||"" }; });
}

/* ---------------------------- STOCK (reserved at checkout) -----------------
   Stock is taken when the order is PLACED and given back if it's cancelled or
   rejected. The shop never blocks on stock: whatever isn't on the shelf becomes
   an "advance order" line (advance:true) that is under production.
   Each ticket line remembers how many units it took from stock in `reserved`
   (lines from before this feature have no `reserved` and are never touched). */
function isVoidOrder(o){ return o && (o.status==="rejected" || o.status==="cancelled"); }
function stockNum(it){ return Math.max(0, Number(it.stock)||0); }

function buildLinesForCartItem(it, qty){
  const have = stockNum(it), take = Math.min(have, qty), rest = qty - take;
  const base = { itemId:it.id, name:it.name, segment:it.segment, rate:it.rate, oum:it.oum, avail:null };
  const lines = [];
  if(take>0) lines.push({ ...base, qty:take, reserved:take });
  if(rest>0) lines.push({ ...base, qty:rest, reserved:0, advance:true });
  it.stock = have - take;
  return lines;
}
function releaseOrderStock(o){
  let back = 0;
  (o.items||[]).forEach(i=>{
    const r = Number(i.reserved)||0; if(r<=0) return;
    const c = CATALOG.find(c=>c.id===i.itemId);
    if(c){ c.stock = (Number(c.stock)||0) + r; back += r; }
    i.reserved = 0;
  });
  return back;
}
/* Admin review: a line served from stock keeps its reservation; a line marked
   In production / Unavailable gives it back; a line switched back to Available
   takes whatever is on the shelf. */
function reconcileLineStock(i){
  if(i.reserved===undefined) return;
  const c = CATALOG.find(c=>c.id===i.itemId); if(!c) return;
  if(i.avail!=="available" && i.reserved>0){ c.stock = (Number(c.stock)||0) + i.reserved; i.reserved = 0; }
  else if(i.avail==="available" && !(i.reserved>0)){
    const take = Math.min(stockNum(c), Number(i.qty)||0);
    c.stock = stockNum(c) - take; i.reserved = take;
  }
}
function stockBadgeHTML(it){
  const n = stockNum(it);
  if(n<=0) return `<span class="stock-badge prod">Under production · advance order</span>`;
  return `<span class="stock-badge ${n<=10?"low":""}">${n<=10?`Only ${n} left`:`${n} in stock`}</span>`;
}
function advanceNote(it, qty, inShop){
  const n = stockNum(it);
  if(qty<=n || (inShop && n<=0)) return "";
  if(n<=0) return `Advance order — all ${qty} ${it.oum} will be under production.`;
  return `${n} in stock · the other ${qty-n} ${it.oum} will be an advance order (under production).`;
}

function makeOrder(user, items, township, segment, batchId){
  const id = "TCK-2026-"+String(state.orderSeq++).padStart(4,"0");
  return {
    id, batchId, segment, deliveryType: SEGMENT_TYPE[segment]||"A",
    userEmail:user.email, userName:user.name, userPosition:user.position,
    township, items, status:"new", createdAt: Date.now(),
    confirmedAt:null, ackAt:null, prepStatus:null, prepDoneAt:null,
    drNumber:null, iomNumber:null,
    bttNumber:null, noBtt:false, vehicleId:null, deliveryDate:null, bttAt:null,
    drAt:null, customerConfirmedAt:null, releaseAt:null,
    feeBreakdown:null, totalBilled:0, deliveredAt:null,
    late:false, recurring:false, cycleCount:1, adminRemark:"", parentTicket:null
  };
}
function groupKeyFor(t){ return t.noBtt ? ("SOLO-"+t.id) : (t.bttNumber || ("PENDING-"+t.id)); }
function siblingTickets(t){ return t.noBtt || !t.bttNumber ? [t] : state.orders.filter(o=>o.bttNumber===t.bttNumber); }

function seedDemoOrders(){
  const u = state.users[0];
  const it = (name,qty)=>{ const c = CATALOG.find(c=>c.name===name); return {itemId:c.id,name:c.name,segment:c.segment,rate:c.rate,oum:c.oum,qty,avail:"available"}; };

  // 1) Fully delivered, single-township Type A trip
  let o1 = makeOrder(u, [it("Bougainvillea",40),it("Golden Duranta",25)], "Newport City Estate Association", "SHRUBS", "BATCH-DEMO-1");
  Object.assign(o1, {
    status:"delivered", createdAt: Date.now()-1000*60*60*24*9, confirmedAt: Date.now()-1000*60*60*24*8,
    ackAt: Date.now()-1000*60*60*24*8, prepDoneAt: Date.now()-1000*60*60*24*6, drNumber:"DR-2026-0101",
    iomNumber:"IOM-08-2026", bttNumber:"BTT-2026-0071", bttAt: Date.now()-1000*60*60*24*5,
    vehicleId:"VEH-2", deliveryDate:"2026-08-05", drAt: Date.now()-1000*60*60*24*4,
    customerConfirmedAt: Date.now()-1000*60*60*24*3,
    releaseAt: new Date("2026-08-05T09:00").getTime(), deliveredAt: new Date("2026-08-05T14:30").getTime(),
    totalBilled:6000,
    feeBreakdown:{townships:1, base:5000, hours:5.5, overtimeHours:1.5, overtimeFee:2000, perTownshipOvertime:2000, total:7000}
  });
  state.orders.push(o1);

  // 2) Shared BTT across two townships, both awaiting customer confirmation
  //    (illustrates the "one BTT, split overtime fee by township count" rule)
  let o2 = makeOrder(u, [it("Petunia",60),it("Sunflower",30)], "Uptown Bonifacio Estate Association", "FLOWERS", "BATCH-DEMO-2");
  Object.assign(o2, { status:"for_delivery", createdAt: Date.now()-1000*60*60*24*4, confirmedAt: Date.now()-1000*60*60*24*3,
    ackAt: Date.now()-1000*60*60*24*3, prepDoneAt: Date.now()-1000*60*60*24*2, drNumber:"DR-2026-0114", iomNumber:"IOM-08-2026",
    bttNumber:"BTT-2026-0088", bttAt: Date.now()-1000*60*60*24, vehicleId:"VEH-1", deliveryDate:"2026-08-29", drAt: Date.now()-1000*60*60*10 });
  state.orders.push(o2);
  let o3 = makeOrder(u, [it("Red Acalypha",50)], "Mckinley West Estate Association", "SHRUBS", "BATCH-DEMO-3");
  Object.assign(o3, { status:"for_delivery", createdAt: Date.now()-1000*60*60*24*3, confirmedAt: Date.now()-1000*60*60*24*2,
    ackAt: Date.now()-1000*60*60*24*2, prepDoneAt: Date.now()-1000*60*60*24, drNumber:"DR-2026-0115", iomNumber:"IOM-08-2026",
    bttNumber:"BTT-2026-0088", bttAt: Date.now()-1000*60*60*24, vehicleId:"VEH-1", deliveryDate:"2026-08-29", drAt: Date.now()-1000*60*60*9 });
  state.orders.push(o3);

  // 3) Awaiting customer acknowledgement
  let o4 = makeOrder(u, [it("Regular Banner - 12oz",30)], "Newport City Estate Association", "BANNERS", "BATCH-DEMO-4");
  Object.assign(o4, { status:"awaiting_ack", createdAt: Date.now()-1000*60*60*30, confirmedAt: Date.now()-1000*60*60*20,
    adminRemark:"All items available. Please review and acknowledge to proceed." });
  state.orders.push(o4);

  // 4) Brand-new ticket
  let o5 = makeOrder(u, [it("A-Frame (3ft x 3ft)",2), it("Vinyl Sticker",15)], "Southwoods City Estate Association", "SIGNAGES", "BATCH-DEMO-5");
  o5.createdAt = Date.now()-1000*60*60*50;
  state.orders.push(o5);

  // 5) Type B (thermoplastics) recurring job — previous visit unfinished
  let o6 = makeOrder(u, [it("White Normal Thermoplastic Paint",120),it("Complete Asphalt Works",40)], "Westside City Estate Association", "THERMOPLASTICS", "BATCH-DEMO-6");
  Object.assign(o6, { status:"ready_for_btt", createdAt: Date.now()-1000*60*60*24*6, confirmedAt: Date.now()-1000*60*60*24*5,
    ackAt: Date.now()-1000*60*60*24*5, prepDoneAt: Date.now()-1000*60*60*24*4, drNumber:"DR-2026-0120", iomNumber:"IOM-08-2026",
    recurring:true, cycleCount:2, totalBilled:3800,
    adminRemark:"Cycle 1 (Aug 24): road marking not finished by 11pm — rebooked, only the ₱3,800 delivery fee was billed again." });
  state.orders.push(o6);

  // 6) No-BTT-required example, ready for DR
  let o7 = makeOrder(u, [it("Narra",10)], "Global-Estate Resort, Inc.", "TREES", "BATCH-DEMO-7");
  Object.assign(o7, { status:"ready_for_dr", createdAt: Date.now()-1000*60*60*24*2, confirmedAt: Date.now()-1000*60*60*24*2,
    ackAt: Date.now()-1000*60*60*24*2, prepDoneAt: Date.now()-1000*60*60*24, drNumber:"DR-2026-0121", iomNumber:"",
    noBtt:true, bttNumber:null, vehicleId:"VEH-4", deliveryDate:"2026-08-30", bttAt: Date.now()-1000*60*60*20 });
  state.orders.push(o7);
}

function itemAvailLabel(i){
  if(!i.avail && i.advance) return `<span class="unavail">Advance order · under production</span>`;
  if(!i.avail || i.avail==="available") return peso(i.rate*i.qty);
  if(i.avail==="production") return `<span class="unavail">In production${i.etaDate?` · avail. ${fmtDateShort(new Date(i.etaDate+"T00:00:00").getTime())}`:""}</span>`;
  if(i.avail==="released") return `<span class="released">Moved to ${i.releasedTo||"new ticket"}</span>`;
  return `<span class="unavail">Unavailable</span>`;
}
function orderTotal(o){ return o.items.reduce((s,i)=> s + ((!i.avail || i.avail==="available") ? i.rate*i.qty : 0), 0); }

/* ---------------------------- PRODUCTION → AVAILABLE AUTOMATION -----------
   Items an admin marks "In production" carry an ETA date. Once that date
   arrives, the item is split out of its original ticket into a brand-new
   ticket that jumps straight into Preparation (it was already reviewed —
   it was just waiting on stock), the requester gets a pop-up the next time
   they're in the app, and the event is logged. Items marked "Unavailable"
   are logged immediately and never proceed anywhere.
   ---------------------------------------------------------------------- */
function checkAvailabilityReleases(){
  const today = new Date(); today.setHours(0,0,0,0);
  state.orders.slice().forEach(o=>{
    if(isVoidOrder(o)) return;
    o.items.forEach(item=>{
      if(item.avail==="production" && item.etaDate && !item.released){
        const eta = new Date(item.etaDate+"T00:00:00");
        if(eta.getTime() <= today.getTime()) releaseItem(o, item);
      }
    });
  });
}
/* Same rule as checkReleases() in Code.gs: while the ticket hasn't gone out for
   delivery yet, an item that finishes production simply becomes available ON
   that ticket (same DR). Only when the ticket is already out for delivery or
   delivered does the item get its own new ticket and DR. */
const MERGE_STATUSES = ["new","awaiting_ack","preparation","ready_for_btt","ready_for_dr"];
function releaseLogId(order, item){ return "AVL-"+order.id+"-"+order.items.indexOf(item); }
function pushReleaseLog(entry){ if(!state.availabilityLog.some(l=>l.id===entry.id)) state.availabilityLog.push(entry); }
function mergeProducedItem(order, item){
  item.avail = "available"; item.fromProduction = true; item.producedAt = Date.now();
  const when = fmtDateShort(new Date(item.etaDate+"T00:00:00").getTime());
  const note = `${item.name} × ${item.qty} ${item.oum} came out of production (${when}) and was added to this ticket — it ships on this ticket's DR.`;
  order.adminRemark = order.adminRemark ? order.adminRemark+" "+note : note;
  if(order.drDocUrl) order.drStale = true; // the Google Doc DR was made before this item joined
  pushReleaseLog({
    id:releaseLogId(order,item), ts:Date.now(),
    orderId:order.id, newTicketId:order.id, merged:true, itemName:item.name, qty:item.qty,
    township:order.township, segment:order.segment, userEmail:order.userEmail, result:"available"
  });
  state.notices.push({
    id:"NTC-"+Date.now()+"-"+Math.floor(Math.random()*1000), userEmail:order.userEmail, seen:false,
    message:`${item.name} × ${item.qty} ${item.oum} from ${order.id} is now available — it will ship together with the rest of this ticket, on the same DR.`,
    ticketId:order.id
  });
}
function releaseItem(order, item){
  if(MERGE_STATUSES.includes(order.status)) return mergeProducedItem(order, item);
  item.released = true;
  item.avail = "released";
  const t = makeOrder(
    { email:order.userEmail, name:order.userName, position:order.userPosition },
    [{ itemId:item.itemId, name:item.name, segment:item.segment, rate:item.rate, oum:item.oum, qty:item.qty, avail:"available" }],
    order.township, order.segment, (order.batchId||order.id)+"-R"
  );
  // Same id the server uses (parent ticket + "-R" + item number), so if the browser and the server
  // both notice the item is ready, they write the SAME row instead of creating two tickets.
  state.orderSeq--; t.id = order.id + "-R" + (order.items.indexOf(item)+1);
  if(state.orders.some(o=>o.id===t.id)){ item.released = true; item.avail = "released"; item.releasedTo = t.id; return; }
  t.status = "preparation"; t.prepStatus = "ongoing";
  t.confirmedAt = Date.now(); t.ackAt = Date.now();
  t.parentTicket = order.id;
  t.adminRemark = `Auto-released from ${order.id} — item became available on ${fmtDateShort(new Date(item.etaDate+"T00:00:00").getTime())}.`;
  state.orders.push(t);
  item.releasedTo = t.id;
  pushReleaseLog({
    id:releaseLogId(order,item), ts:Date.now(),
    orderId:order.id, newTicketId:t.id, itemName:item.name, qty:item.qty,
    township:order.township, segment:order.segment, userEmail:order.userEmail, result:"available"
  });
  state.notices.push({
    id:"NTC-"+Date.now()+"-"+Math.floor(Math.random()*1000), userEmail:order.userEmail, seen:false,
    message:`${item.name} × ${item.qty} ${item.oum} from ${order.id} is now available — it has moved to a new ticket, ${t.id}, and gone straight into preparation.`,
    ticketId:t.id
  });
}
function logUnavailable(order, item){
  if(item.loggedUnavailable) return;
  item.loggedUnavailable = true;
  state.availabilityLog.push({
    id:"AVL-"+Date.now()+"-"+Math.floor(Math.random()*1000), ts:Date.now(),
    orderId:order.id, newTicketId:null, itemName:item.name, qty:item.qty,
    township:order.township, segment:order.segment, userEmail:order.userEmail, result:"unavailable"
  });
}
function maybeShowAvailabilityNotice(){
  if(!state.currentUser || state.currentUser.role==="admin") return;
  const n = state.notices.find(n=>n.userEmail===state.currentUser.email && !n.seen);
  if(!n) return;
  n.seen = true;
  const panel = document.getElementById("generic-modal-panel");
  panel.innerHTML = `
    <div class="modal-head"><h3>Good news — item available</h3><button class="icon-btn" data-close="generic-modal">✕</button></div>
    <div class="modal-body"><p>${n.message}</p></div>
    <div class="modal-foot"><button class="btn btn-primary" data-close="generic-modal">Got it</button></div>`;
  panel.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click", ()=>closeModal("generic-modal")));
  openModal("generic-modal");
}
function peso(n){ return "₱"+Number(n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtDate(ts){ if(!ts) return "—"; return new Date(ts).toLocaleString("en-PH",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}); }
function fmtDateShort(ts){ if(!ts || isNaN(ts)) return "—"; return new Date(ts).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}); }
function hoursBetween(a,b){ return ((b-a)/(1000*60*60)); }
function turnaroundLabel(o){
  if(!o.deliveredAt) return "—";
  const h = hoursBetween(o.createdAt, o.deliveredAt);
  if(h < 24) return h.toFixed(1)+" hrs";
  return (h/24).toFixed(1)+" days";
}
function inDateRange(ts, fromStr, toStr){
  if(!ts) return false;
  const d = new Date(ts).setHours(0,0,0,0);
  if(fromStr && d < new Date(fromStr).setHours(0,0,0,0)) return false;
  if(toStr && d > new Date(toStr).setHours(0,0,0,0)) return false;
  return true;
}

/* ---------------------------- BILLING --------------------------------------
   Type A (Signages, Trees, Shrubs, Flowers, Tree Seedlings, Tissue Culture
   Ornamental Plants): flat fee by distinct-township count for the trip, plus
   ₱1,000 per exceeded hour past a 4-hour allowance — that overtime fee is
   split evenly across the distinct townships sharing the BTT/trip.
   Type B (Thermoplastics): ₱3,800 per distinct township for the 1pm–11pm
   window, no overtime — instead the crew is asked if the job is finished;
   if not, it's rebooked and only the ₱3,800 delivery fee bills again (not
   the materials).
   ---------------------------------------------------------------------------*/
function computeGroupFee(members, releaseTs, deliverTs){
  const hours = Math.max(0, (deliverTs - releaseTs) / 3600000);
  const A = members.filter(t=>t.deliveryType==="A");
  const B = members.filter(t=>t.deliveryType==="B");
  const breakdown = {};
  let total = 0;
  if(A.length){
    const townships = [...new Set(A.map(t=>t.township))];
    const n = townships.length;
    const base = n===1?5000 : n===2?3500 : 2500;
    const overtimeHours = Math.max(0, hours-4);
    const overtimeFee = Math.ceil(overtimeHours)*1000;
    breakdown.A = { townships:n, base, hours, overtimeHours, overtimeFee, perTownshipOvertime: overtimeFee/n, total: base+overtimeFee };
    total += breakdown.A.total;
  }
  if(B.length){
    const townships = [...new Set(B.map(t=>t.township))];
    const n = townships.length;
    const fee = 3800*n;
    breakdown.B = { townships:n, hours, fee };
    total += fee;
  }
  return { total, breakdown, hours };
}

/* ---------------------------- TOAST --------------------------------------*/
let toastTimer;
function toast(msg, warn){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.toggle("warn", !!warn);
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove("show"), 3200);
}

/* ---------------------------- EXPORT (PDF / PNG / CSV) ---------------------*/
function exportPrint(){ window.print(); }
function exportCapture(filename){
  const el = document.getElementById("view-root");
  if(typeof html2canvas === "undefined"){ toast("Capture library failed to load — check your connection.", true); return; }
  toast("Capturing…");
  html2canvas(el, {backgroundColor:"#f4f4ec", scale:2}).then(canvas=>{
    const link = document.createElement("a");
    link.download = filename+".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}
function exportButtonsHTML(name){
  return `<div class="export-row">
    <button class="btn btn-ghost btn-sm" onclick="exportPrint()">⤓ Export PDF</button>
    <button class="btn btn-ghost btn-sm" onclick="exportCapture('${name}')">◱ Capture PNG</button>
  </div>`;
}
function downloadCSV(rows, filename){
  const csv = rows.map(r=>r.map(v=>`"${String(v==null?"":v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv],{type:"text/csv"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = filename; link.click();
}
function syncToSheets(){
  const rows = [["Ticket ID","Batch","Segment","Type","Township","Status","DR Number","IOM Number","BTT Number","Vehicle","Delivery Date","Created At","Delivered At","Total Billed"]];
  state.orders.forEach(o=>{
    const vehicle = VEHICLES.find(v=>v.id===o.vehicleId);
    rows.push([o.id,o.batchId,o.segment,o.deliveryType,o.township,o.status,o.drNumber||"",o.iomNumber||"",
      o.noBtt?"NO BTT REQUIRED":(o.bttNumber||""), vehicle?vehicle.name:"", o.deliveryDate||"",
      new Date(o.createdAt).toISOString(), o.deliveredAt?new Date(o.deliveredAt).toISOString():"", o.totalBilled||0]);
  });
  downloadCSV(rows, "cgs-tickets-snapshot.csv");
  toast(CGS_SHEETS.enabled() ? "CSV snapshot downloaded — live data is already syncing to your connected Sheet." : "CSV snapshot downloaded. Connect a Google Sheet (see config.js) for live, automatic syncing.");
}

/* ---------------------------- AUTH ----------------------------------------*/
const authScreen = document.getElementById("auth-screen");
const appEl = document.getElementById("app");

function switchAuthTab(mode){
  document.querySelectorAll(".auth-tab").forEach(t=>t.classList.toggle("active", t.dataset.auth===mode));
  document.getElementById("signin-form").classList.toggle("hidden", mode!=="signin");
  document.getElementById("signup-form").classList.toggle("hidden", mode!=="signup");
  document.getElementById("company-form").classList.toggle("hidden", mode!=="company");
  if(mode==="signup") populateCompanySelect();
}
document.querySelectorAll(".auth-tab").forEach(tab=>tab.addEventListener("click", ()=>switchAuthTab(tab.dataset.auth)));
document.getElementById("tab-company").classList.toggle("hidden", !CGS_SHEETS.enabled());
document.getElementById("fill-user").addEventListener("click",()=>{
  document.getElementById("si-email").value="user@megaworldcorp.com";
  document.getElementById("si-password").value="demo";
});
document.getElementById("fill-admin").addEventListener("click",()=>{
  document.getElementById("si-email").value="admin@megaworldcorp.com";
  document.getElementById("si-password").value="demo";
});

/* --- show / hide password (eye) --- */
document.querySelectorAll(".pw-toggle").forEach(btn=>btn.addEventListener("click", ()=>{
  const input = document.getElementById(btn.dataset.pw);
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  btn.classList.toggle("on", show);
  btn.setAttribute("aria-pressed", String(show));
  btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  btn.title = show ? "Hide password" : "Show password";
}));
function resetPasswordFields(){
  ["si-password","su-password"].forEach(id=>{
    const el = document.getElementById(id); el.value = ""; el.type = "password";
    const b = document.querySelector(`.pw-toggle[data-pw="${id}"]`);
    if(b){ b.classList.remove("on"); b.setAttribute("aria-pressed","false"); b.setAttribute("aria-label","Show password"); b.title="Show password"; }
  });
}

/* --- remember me (stored only in this browser; never the password) --- */
const REMEMBER_DAYS = 30;
const ls = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
function readRememberedSession(){
  try{
    const s = JSON.parse(ls.get("cgs_session")||"null");
    if(s && s.token && s.exp > Date.now()) return s;
  }catch(e){}
  ls.del("cgs_session"); return null;
}
(function prefillRemembered(){
  const last = ls.get("cgs_last_email");
  if(last){ document.getElementById("si-email").value = last; document.getElementById("si-remember").checked = true; }
})();

/* --- sign-in is checked by the Apps Script server ---------------------------
   Passwords are never stored in the Sheet and never kept in this browser: the
   server keeps a salted hash privately and hands back a signed token. "Remember
   me" only keeps that token (30 days). With no Sheet connected the app runs on
   the two local demo accounts instead. */
let bootReady = Promise.resolve(); // set at the bottom (remembered-session check)
(function sheetModeHints(){
  const on = CGS_SHEETS.enabled();
  document.getElementById("si-demo-hint").classList.toggle("hidden", on);
  document.getElementById("si-forgot").classList.toggle("hidden", !on);
})();

/* The Sheet's data arrives together with the sign-in answer, already filtered for this person's role. */
function ingestBundle(data, user){
  hydrateTownships(data.townships);
  hydrateFromRemote(data);
  if(user.role==="admin" && !(data.orders||[]).length && !(data.catalog||[]).length) seedDemoOrders();   // very first run only
  ensureTownshipInfo();
  CGS_SHEETS.ingest(data, user.role);
}
function finishSignIn(user, token, remember, data){
  CGS_SHEETS.token = token || null;
  if(data) ingestBundle(data, user);
  if(remember && token){
    ls.set("cgs_session", JSON.stringify({ token, email:user.email, exp: Date.now()+REMEMBER_DAYS*86400000 }));
    ls.set("cgs_last_email", user.email);
  } else { ls.del("cgs_session"); ls.del("cgs_last_email"); }
  login(user);
}
async function refreshFromSheet(){
  const data = await CGS_SHEETS.loadAll(); if(!data || !state.currentUser) return;
  ingestBundle(data, state.currentUser); render();
}
CGS_SHEETS.onDenied = ()=>{ toast("Some changes weren't allowed, so your view was refreshed from the Sheet.", true); refreshFromSheet(); };
function localDemoUser(email, pass){
  const u = state.users.find(u=>u.email.toLowerCase()===email);
  return (u && u.password===pass) ? u : null;
}

/* Shown after a sign-in with a temporary password. Resolves to {user, token}, or null if cancelled. */
function askNewPassword(user, tempPass, remember){
  return new Promise(resolve=>{
    const modal = document.getElementById("pwchange-modal");
    const f1 = document.getElementById("pc-new"), f2 = document.getElementById("pc-confirm");
    const msg = document.getElementById("pc-msg"), save = document.getElementById("pc-save"), cancel = document.getElementById("pc-cancel");
    document.getElementById("pc-who").textContent = user.name;
    f1.value = ""; f2.value = ""; msg.textContent = ""; save.disabled = false;
    ["pc-new","pc-confirm"].forEach(id=>{
      document.getElementById(id).type = "password";
      const b = document.querySelector(`.pw-toggle[data-pw="${id}"]`);
      if(b){ b.classList.remove("on"); b.setAttribute("aria-pressed","false"); b.setAttribute("aria-label","Show password"); }
    });
    const close = val=>{ modal.classList.remove("open"); save.onclick = null; cancel.onclick = null; f2.onkeydown = null; resolve(val); };
    cancel.onclick = ()=>close(null);
    save.onclick = async ()=>{
      const a = f1.value, b = f2.value;
      if(a.length < 8){ msg.textContent = "Use at least 8 characters."; return; }
      if(a !== b){ msg.textContent = "The two passwords don't match."; return; }
      if(a === tempPass){ msg.textContent = "Choose a password that's different from the temporary one."; return; }
      save.disabled = true; msg.textContent = "";
      try{ const r = await CGS_SHEETS.changePassword(user.email, tempPass, a, remember); toast("Password updated."); close(r); }
      catch(err){ msg.textContent = err.message; save.disabled = false; }
    };
    f2.onkeydown = e=>{ if(e.key==="Enter") save.onclick(); };
    modal.classList.add("open"); setTimeout(()=>f1.focus(), 60);
  });
}

document.getElementById("signin-form").addEventListener("submit", async e=>{
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true;
  try{
    const email = document.getElementById("si-email").value.trim().toLowerCase();
    const pass = document.getElementById("si-password").value;
    const remember = document.getElementById("si-remember").checked;
    if(!CGS_SHEETS.enabled()){
      const u = localDemoUser(email, pass);
      if(!u){ toast("Incorrect email or password.", true); return; }
      finishSignIn(u, null, remember); return;
    }
    let r;
    try{ r = await CGS_SHEETS.login(email, pass, remember); }
    catch(err){ toast(err.message, true); return; }
    if(r.mustChangePassword){
      const done = await askNewPassword(r.user, pass, remember);
      if(!done) return;
      finishSignIn(done.user, done.token, remember, done.data);
    } else finishSignIn(r.user, r.token, remember, r.data);
  } finally { btn.disabled = false; }
});
document.getElementById("signup-form").addEventListener("submit", async e=>{
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true;
  try{
    const name = document.getElementById("su-name").value.trim();
    const position = document.getElementById("su-position").value.trim();
    const email = document.getElementById("su-email").value.trim().toLowerCase();
    const password = document.getElementById("su-password").value;
    if(password.length < 8){ toast("Password must be at least 8 characters.", true); return; }
    const spVisible = !document.getElementById("su-sp-fields").classList.contains("hidden");
    const extra = spVisible ? {
      companyId: document.getElementById("su-company").value,
      billTo: document.getElementById("su-billto").value.trim(),
      cpNumber: document.getElementById("su-cp").value.trim()
    } : {};
    if(spVisible && !extra.companyId){ toast("Choose your company from the list.", true); return; }
    let user, token = null, data = null;
    if(CGS_SHEETS.enabled()){
      try{ const r = await CGS_SHEETS.registerUser({ name, position, email, ...extra }, password, false); user = r.user; token = r.token; data = r.data; }
      catch(err){ toast("Could not create your account: " + err.message, true); return; }
    } else {
      if(state.users.some(u=>u.email.toLowerCase()===email)){ toast("An account with that email already exists.", true); return; }
      user = {name, position, email, password, role:"user", project: email.endsWith("@megaworldcorp.com") ? "megaworld" : "special"};
      state.users.push(user);
    }
    toast(user.project==="special" ? "Account created — welcome to CGS Central." : "Account created — welcome to CGS Central.");
    finishSignIn(user, token, false, data);
  } finally { btn.disabled = false; }
});

/* --- sign-up: extra fields for people outside Megaworld --- */
function populateCompanySelect(selectedId){
  const sel = document.getElementById("su-company"); if(!sel) return;
  const draw = list=>{
    const keep = selectedId || sel.value;
    sel.innerHTML = `<option value="">${list.length?"Select your company…":"No companies yet — register yours first"}</option>` +
      list.map(c=>`<option value="${escAttr(c.id)}">${escAttr(c.name)}${c.status==="pending"?" (Waiting for Admin's Approval)":""}</option>`).join("");
    if(keep) sel.value = keep;
  };
  if(CGS_SHEETS.companies) draw(CGS_SHEETS.companies);
  else CGS_SHEETS.prefetchCompanies().then(l=>draw(l||[]));
}
function toggleSpFields(){
  const email = document.getElementById("su-email").value.trim().toLowerCase();
  const show = CGS_SHEETS.enabled() && email.includes("@") && !email.endsWith("@megaworldcorp.com");
  document.getElementById("su-sp-fields").classList.toggle("hidden", !show);
  ["su-company","su-billto","su-cp"].forEach(id=>{ document.getElementById(id).required = show; });
  if(show) populateCompanySelect();
}
document.getElementById("su-email").addEventListener("input", toggleSpFields);
document.getElementById("su-goto-register").addEventListener("click", ()=>switchAuthTab("company"));

/* --- Register a company --- */
let justRegisteredCompanyId = null;
document.getElementById("company-form").addEventListener("submit", async e=>{
  e.preventDefault();
  const btn = document.getElementById("co-reg-submit");
  const name = document.getElementById("co-reg-name").value.trim();
  const address = document.getElementById("co-reg-address").value.trim();
  const email = document.getElementById("co-reg-email").value.trim();
  const file = document.getElementById("co-reg-pdf").files[0];
  if(!file){ toast("Attach the PDF of your BIR Form 2303.", true); return; }
  if(!(file.type==="application/pdf" || /\.pdf$/i.test(file.name))){ toast("The BIR Form 2303 must be a PDF file.", true); return; }
  if(file.size > 5*1024*1024){ toast("That PDF is over 5 MB. Please attach a smaller file.", true); return; }
  btn.disabled = true; btn.textContent = "Submitting…";
  try{
    const pdfBase64 = await CGS_SHEETS.fileToBase64(file);
    const r = await CGS_SHEETS.registerCompany({ name, address, email, pdfName:file.name, pdfBase64 });
    justRegisteredCompanyId = r.company.id;
    await CGS_SHEETS.refreshCompanies();
    document.getElementById("co-reg-done-title").textContent = "Registration received";
    document.getElementById("co-reg-done-msg").textContent = `${name} is now waiting for admin approval. We'll email the result to ${email}. You can already create your account — choose your company from the list (it shows as "Waiting for Admin's Approval" until confirmed).`;
    document.getElementById("co-reg-done").classList.remove("hidden");
    btn.classList.add("hidden");
  }catch(err){ toast(err.message, true); }
  finally{ btn.disabled = false; btn.textContent = "Submit registration"; }
});
document.getElementById("co-reg-to-signup").addEventListener("click", ()=>{
  switchAuthTab("signup");
  const form = document.getElementById("company-form"); form.reset();
  document.getElementById("co-reg-done").classList.add("hidden"); document.getElementById("co-reg-submit").classList.remove("hidden");
  populateCompanySelect(justRegisteredCompanyId);
});

/* ---------------------------- MENU: floating hamburger + collapsible sidebar -
   Phones: the sidebar slides in over the page (floating ☰ button, tap outside
   or Esc to close). Desktop: the sidebar can be tucked away and the ☰ button
   brings it back; that choice is remembered. */
const mqPhone = window.matchMedia ? window.matchMedia("(max-width: 900px)") : { matches:false, addEventListener(){} };
const SIDEBAR_KEY = "cgs_sidebar_collapsed";
function menuIsOpen(){ return mqPhone.matches ? appEl.classList.contains("menu-open") : !appEl.classList.contains("sidebar-collapsed"); }
function syncMenuAria(){
  const fab = document.getElementById("menu-fab");
  fab.setAttribute("aria-expanded", String(menuIsOpen()));
}
function setMenuOpen(open){
  if(mqPhone.matches) appEl.classList.toggle("menu-open", open);
  else { appEl.classList.toggle("sidebar-collapsed", !open); ls.set(SIDEBAR_KEY, open ? "0" : "1"); }
  syncMenuAria();
}
document.getElementById("menu-fab").addEventListener("click", ()=>setMenuOpen(true));
document.getElementById("sidebar-close").addEventListener("click", ()=>setMenuOpen(false));
document.getElementById("sidebar-backdrop").addEventListener("click", ()=>setMenuOpen(false));
document.addEventListener("keydown", e=>{ if(e.key==="Escape" && mqPhone.matches && menuIsOpen()) setMenuOpen(false); });
document.getElementById("sidebar").addEventListener("click", e=>{ if(mqPhone.matches && e.target.closest(".nav-item")) setMenuOpen(false); });
(mqPhone.addEventListener ? ()=>mqPhone.addEventListener("change", onBreakpoint) : ()=>{})();
function onBreakpoint(){
  appEl.classList.remove("menu-open");
  appEl.classList.toggle("sidebar-collapsed", !mqPhone.matches && ls.get(SIDEBAR_KEY)==="1");
  syncMenuAria();
}
onBreakpoint();

/* little "saving…/saved" dot in the top bar */
(function(){
  const el = document.getElementById("sync-status"); if(!el) return;
  const text = { saving:"Saving…", saved:"Saved", error:"Offline — retrying" };
  CGS_SHEETS.onStatus = st=>{
    el.dataset.state = st; el.classList.toggle("hidden", !CGS_SHEETS.enabled());
    el.querySelector(".sync-text").textContent = text[st] || "";
    el.title = text[st] || "";
  };
  el.classList.toggle("hidden", !CGS_SHEETS.enabled());
})();

const ROLE_LABEL = { admin:"CGS Admin", approver1:"Approver 1", approver2:"Approver 2", user:"Requester" };
function login(u){
  state.currentUser = u; billingFilter = "action";
  authScreen.classList.add("hidden");
  appEl.classList.remove("hidden");
  document.getElementById("who-name").textContent = u.name;
  document.getElementById("topbar-name").textContent = u.name;
  appEl.classList.remove("menu-open"); syncMenuAria();
  const isAdmin = u.role==="admin", isAppr = isApprover(u), isSP = isSPUser(u);
  document.getElementById("who-role").textContent = isSP ? (ROLE_LABEL.user+" · "+(u.company||"Special Projects")) : (ROLE_LABEL[u.role]||"Requester")+" · "+u.project;
  document.getElementById("nav-user").classList.toggle("hidden", isAdmin || isAppr || isSP);
  document.getElementById("nav-sp").classList.toggle("hidden", !isSP);
  document.getElementById("nav-approver").classList.toggle("hidden", !isAppr);
  document.getElementById("nav-admin").classList.toggle("hidden", !isAdmin);
  document.getElementById("open-cart-btn").classList.toggle("hidden", isAdmin || isAppr);
  if(isAdmin && CGS_SHEETS.enabled()) loadCompaniesAdmin();
  navigate(isAdmin ? "a-overview" : isAppr ? "p-queue" : "u-dashboard");
}
async function signOut(){
  const flush = CGS_SHEETS.saveNow(snapshotState).catch(()=>{});           // push anything unsaved while the token is still valid
  ls.del("cgs_session"); resetPasswordFields();
  appEl.classList.remove("menu-open"); syncMenuAria();
  appEl.classList.add("hidden");
  authScreen.classList.remove("hidden");
  await Promise.race([flush, new Promise(r=>setTimeout(r, 4000))]);
  CGS_SHEETS.token = null; CGS_SHEETS.loaded = false; CGS_SHEETS.canWrite = {}; CGS_SHEETS._getPayload = null; CGS_SHEETS._pending = false;
  state.currentUser = null; state.cart = []; state.spCart = []; state.spPayMode = ""; state.orders = []; state.availabilityLog = []; state.companies = [];
  updateCartBadge();
}
document.getElementById("logout-btn").addEventListener("click", signOut);
document.getElementById("topbar-logout").addEventListener("click", signOut);

/* ---------------------------- NAVIGATION -----------------------------------*/
const viewTitles = {
  "u-dashboard":"Dashboard", "u-shop":"Shop", "u-ack":"Acknowledge orders", "u-confirm":"Confirm Delivery",
  "a-overview":"Overview", "a-new":"New Orders", "a-confirm":"Confirmation of Orders",
  "a-prep":"Preparation of Orders", "a-btt":"BTT Assignment", "a-dr":"DR Generator",
  "a-delivery":"For Delivery", "a-delivered":"Delivered Items", "a-history":"Overall Delivery History",
  "a-edit":"Edit Orders", "a-vehicles":"Vehicle Summary", "a-item-summary":"Item Summary",
  "a-items":"Items & Pricing", "a-availability":"Availability Watch", "a-townships":"Township Addresses", "a-users":"Users & Passwords",
  "a-billing":"Billing", "u-billing":"Billing", "a-companies":"Company registrations", "a-sp-pricing":"Special Projects — Pricing", "a-sp-proposals":"Cost proposals",
  "u-proposals":"Cost proposals", "p-queue":"For my approval", "p-history":"My decisions"
};
let currentView = "u-dashboard";
function navigate(view){
  currentView = view;
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active", b.dataset.view===view));
  document.getElementById("view-title").textContent = viewTitles[view]||"";
  render();
}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));

/* ---------------------------- MODALS ---------------------------------------*/
document.querySelectorAll("[data-close]").forEach(el=>{
  el.addEventListener("click", ()=> document.getElementById(el.dataset.close).classList.remove("open"));
});
function openModal(id){ document.getElementById(id).classList.add("open"); }
function closeModal(id){ document.getElementById(id).classList.remove("open"); }

/* ---------------------------- CART -----------------------------------------*/
const cartDrawer = document.getElementById("cart-drawer");
document.getElementById("open-cart-btn").addEventListener("click", ()=>{ renderCart(); cartDrawer.classList.add("open"); });
document.getElementById("close-cart-btn").addEventListener("click", ()=> cartDrawer.classList.remove("open"));
document.getElementById("cart-backdrop").addEventListener("click", ()=> cartDrawer.classList.remove("open"));

function cartQty(itemId){ const l = state.cart.find(c=>c.itemId===itemId); return l?l.qty:0; }
function setCartQty(itemId, qty){
  const idx = state.cart.findIndex(c=>c.itemId===itemId);
  if(qty<=0){ if(idx>-1) state.cart.splice(idx,1); }
  else if(idx>-1){ state.cart[idx].qty = qty; }
  else { state.cart.push({itemId, qty}); }
  updateCartBadge();
}
function updateCartBadge(){
  const count = isSPUser() ? state.spCart.reduce((s,c)=>s+c.qty,0) : state.cart.reduce((s,c)=>s+c.qty,0);
  const el = document.getElementById("cart-count");
  el.textContent = count;
  el.classList.toggle("zero", count===0);
}
function renderCart(){
  const wrap = document.getElementById("cart-items");
  document.querySelector(".cart-total-row").classList.toggle("hidden", isSPUser());
  document.getElementById("checkout-btn").textContent = isSPUser() ? "Submit for cost proposal" : "Proceed to checkout";
  if(isSPUser()){ renderSpCart(); return; }
  if(state.cart.length===0){
    wrap.innerHTML = `<div class="empty-state"><h4>Your cart is empty</h4><p>Head to the Shop tab to add signages, plants and more.</p></div>`;
  } else {
    const bySeg = {};
    state.cart.forEach(c=>{ const it=CATALOG.find(i=>i.id===c.itemId); (bySeg[it.segment]=bySeg[it.segment]||[]).push({it,c}); });
    wrap.innerHTML = `<p class="muted" style="font-size:11.5px;margin-bottom:8px;">Different segments are placed as separate tickets, each with its own DR.</p>` +
      Object.keys(bySeg).map(seg=>`
      <div style="margin-bottom:6px;"><span class="item-segment">${seg}</span></div>
      ${bySeg[seg].map(({it,c})=>`<div class="cart-line">
        <div class="cart-line-thumb">${itemImageHTML(it)}</div>
        <div class="cart-line-info">
          <div class="cart-line-name">${it.name}</div>
          <div class="cart-line-price">${peso(it.rate)} / ${it.oum}</div>
          ${advanceNote(it,c.qty)?`<div class="adv-note">${advanceNote(it,c.qty)}</div>`:""}
          <div class="cart-line-actions">
            <div class="qty-stepper">
              <button data-cart-dec="${it.id}">−</button><span>${c.qty}</span><button data-cart-inc="${it.id}">+</button>
            </div>
            <button class="cart-line-remove" data-cart-remove="${it.id}">Remove</button>
          </div>
        </div>
      </div>`).join("")}`).join("");
  }
  const total = state.cart.reduce((s,c)=>{ const it=CATALOG.find(i=>i.id===c.itemId); return s+it.rate*c.qty; },0);
  document.getElementById("cart-total").textContent = peso(total);
  document.getElementById("checkout-btn").disabled = state.cart.length===0;

  wrap.querySelectorAll("[data-cart-inc]").forEach(b=>b.addEventListener("click",()=>{ setCartQty(b.dataset.cartInc, cartQty(b.dataset.cartInc)+1); renderCart(); renderIfShop(); }));
  wrap.querySelectorAll("[data-cart-dec]").forEach(b=>b.addEventListener("click",()=>{ setCartQty(b.dataset.cartDec, cartQty(b.dataset.cartDec)-1); renderCart(); renderIfShop(); }));
  wrap.querySelectorAll("[data-cart-remove]").forEach(b=>b.addEventListener("click",()=>{ setCartQty(b.dataset.cartRemove, 0); renderCart(); renderIfShop(); }));
}
function renderIfShop(){ if(currentView==="u-shop") render(); }

document.getElementById("checkout-btn").addEventListener("click", ()=>{
  if(isSPUser()){ openSpSubmit(); return; }
  if(state.cart.length===0) return;
  const sel = document.getElementById("co-township");
  sel.innerHTML = state.townshipsList.map(t=>`<option>${t}</option>`).join("");
  const u = state.currentUser;
  document.getElementById("co-name").textContent = u.name;
  document.getElementById("co-position").textContent = u.position;
  document.getElementById("co-email").textContent = u.email;
  const bySeg = {};
  state.cart.forEach(c=>{ const it=CATALOG.find(i=>i.id===c.itemId); (bySeg[it.segment]=bySeg[it.segment]||[]).push({it,c}); });
  const segCount = Object.keys(bySeg).length;
  const rows = Object.keys(bySeg).map(seg=>{
    const lines = bySeg[seg].map(({it,c})=>`<div class="co-summary-row"><span>${it.name} × ${c.qty} ${it.oum}</span><strong>${peso(it.rate*c.qty)}</strong></div>${advanceNote(it,c.qty)?`<div class="adv-note">${advanceNote(it,c.qty)}</div>`:""}`).join("");
    return `<div style="margin-bottom:8px;"><div class="item-segment" style="margin-bottom:4px;">${seg} — separate ticket</div>${lines}</div>`;
  }).join("");
  const total = state.cart.reduce((s,c)=>{ const it=CATALOG.find(i=>i.id===c.itemId); return s+it.rate*c.qty; },0);
  document.getElementById("co-summary").innerHTML = `<p class="muted" style="font-size:12px;margin-bottom:10px;">This will create <strong>${segCount}</strong> ticket${segCount>1?"s":""} — one per segment.</p>` + rows +
    `<div class="co-summary-row" style="border-top:1px solid var(--sand);margin-top:6px;padding-top:8px;"><span><strong>Total</strong></span><strong>${peso(total)}</strong></div>`;
  cartDrawer.classList.remove("open");
  openModal("checkout-modal");
});

/* Ticket numbers are handed out by the server (so two devices can't clash). */
async function reserveTicketNumbers(n){
  if(!CGS_SHEETS.enabled() || !CGS_SHEETS.token) return;      // local demo: the browser's own counter is fine
  state.orderSeq = await CGS_SHEETS.reserveSeq(n);
}
document.getElementById("place-order-btn").addEventListener("click", async ()=>{
  const btn = document.getElementById("place-order-btn"); if(btn.disabled) return;
  btn.disabled = true;
  try{
    const township = document.getElementById("co-township").value;
    const segCount = new Set(state.cart.map(c=>CATALOG.find(i=>i.id===c.itemId).segment)).size;
    try{ await reserveTicketNumbers(segCount); }
    catch(err){ toast("Couldn't reach CGS to number your ticket, so nothing was ordered. Please try again in a moment.", true); return; }
    const bySeg = {};
    state.cart.forEach(c=>{ const it=CATALOG.find(i=>i.id===c.itemId); (bySeg[it.segment]=bySeg[it.segment]||[]).push(...buildLinesForCartItem(it, c.qty)); });
    const batchId = "BATCH-"+Date.now();
    const created = [];
    Object.keys(bySeg).forEach(seg=>{
      const t = makeOrder(state.currentUser, bySeg[seg], township, seg, batchId);
      state.orders.push(t); created.push(t.id);
    });
    state.cart = [];
    updateCartBadge();
    closeModal("checkout-modal");
    const advanced = state.orders.filter(o=>created.includes(o.id)).some(o=>o.items.some(i=>i.advance));
    toast(`${created.length} ticket${created.length>1?"s":""} placed (${created.join(", ")}) — CGS will confirm availability shortly.${advanced?" Out-of-stock items were placed as advance orders (under production).":""}`);
    navigate("u-dashboard");
  } finally { btn.disabled = false; }
});

/* ---------------------------- RENDER ROOT ----------------------------------*/
const root = document.getElementById("view-root");
function render(){
  checkAvailabilityReleases();
  updateCartBadge();
  updateAdminCounts();
  updateAckCount();
  const fn = VIEWS[currentView];
  root.innerHTML = fn ? fn() : "";
  afterRender(currentView);
  CGS_SHEETS.scheduleSave(snapshotState);
}
function setPill(id, n){ const el = document.getElementById(id); if(el){ el.textContent = n; el.classList.toggle("zero", n===0); } }
function updateSpCounts(){
  const u = state.currentUser; if(!u) return;
  if(u.role==="admin"){
    setPill("c-sp-pricing", state.orders.filter(o=>isSPOrder(o) && SP_PRICING_STATUSES.includes(o.status)).length);
    setPill("c-companies", state.companies.filter(c=>c.status==="pending").length);
  }
  if(isApprover(u)){
    const want = u.role==="approver1" ? "sp_approver1" : "sp_approver2";
    setPill("c-approval", state.orders.filter(o=>o.status===want).length);
  }
  if(u.role==="admin"){
    setPill("c-billing", state.orders.filter(o=>(o.status==="delivered" && !o.billing) || (o.billing && o.billing.status==="for_confirmation")).length);
  }
  if(u.role==="user"){
    const due = state.orders.filter(o=>o.userEmail===u.email && o.billing && o.billing.status==="unpaid").length;
    setPill("billing-count", due); setPill("sp-billing-count", due);
  }
  if(isSPUser(u)){
    setPill("sp-proposal-count", state.orders.filter(o=>isSPOrder(o) && o.userEmail===u.email && o.status==="sp_client").length);
    setPill("sp-confirm-count", state.orders.filter(o=>o.userEmail===u.email && o.status==="for_delivery").length);
  }
}
function updateAdminCounts(){
  updateSpCounts();
  const el = document.getElementById("c-new");
  if(el){ const n = state.orders.filter(o=>o.status==="new").length; el.textContent=n; el.classList.toggle("zero", n===0); }
  const pEl = document.getElementById("c-prod");
  if(pEl){
    const n = state.orders.reduce((s,o)=>s+(isVoidOrder(o)?0:o.items.filter(i=>i.avail==="production" && !i.released).length), 0);
    pEl.textContent = n; pEl.classList.toggle("zero", n===0);
  }
}
function updateAckCount(){
  const el = document.getElementById("ack-count");
  if(el && state.currentUser){
    const n = state.orders.filter(o=>o.userEmail===state.currentUser.email && o.status==="awaiting_ack").length;
    el.textContent = n; el.classList.toggle("zero", n===0);
  }
  const cEl = document.getElementById("confirm-count");
  if(cEl && state.currentUser){
    const n = state.orders.filter(o=>o.userEmail===state.currentUser.email && o.status==="for_delivery").length;
    cEl.textContent = n; cEl.classList.toggle("zero", n===0);
  }
}

/* ---------------------------- STAGE TRACKER --------------------------------*/
function stageTracker(order){
  const sp = isSPOrder(order), stages = sp ? SP_STAGES : STAGES;
  const cur = isVoidOrder(order) ? -1 : (sp ? SP_STAGE_INDEX[order.status] : STAGE_INDEX[order.status]);
  return `<div class="stage-tracker ${sp?"sp-tracker":""}">${stages.map((label,i)=>{
    const done = !isVoidOrder(order) && i<cur;
    const isCurrent = i===cur;
    return `${i>0?`<div class="stage-line ${i<=cur?'done':''}"></div>`:""}
      <div class="stage-node ${done?'done':''} ${isCurrent?'current':''}">
        <div class="dot"></div><div class="label">${label}</div>
      </div>`;
  }).join("")}</div>`;
}

function timelineHTML(o){
  const rows = [];
  if(o.drAt) rows.push(`DR confirmed &amp; sent: <strong>${fmtDate(o.drAt)}</strong>`);
  if(o.customerConfirmedAt) rows.push(`Receipt confirmed by customer: <strong>${fmtDate(o.customerConfirmedAt)}</strong>`);
  if(o.releaseAt) rows.push(`Released: <strong>${fmtDate(o.releaseAt)}</strong>`);
  if(o.deliveredAt) rows.push(`Delivered: <strong>${fmtDate(o.deliveredAt)}</strong>`);
  if(rows.length===0) return "";
  return `<div class="ticket-timeline">${rows.map(r=>`<div class="tl-row">${r}</div>`).join("")}</div>`;
}
function ticketMetaBadges(o){
  if(isSPOrder(o)) return `<span class="type-badge SP">SPECIAL</span>`;
  return `<span class="type-badge ${o.deliveryType}">TYPE ${o.deliveryType}</span> ${o.noBtt?'<span class="nobtt-badge">NO BTT</span>':''}`;
}

/* ============================================================
   USER VIEWS
   ============================================================ */
function myOrders(){ return state.orders.filter(o=>o.userEmail===state.currentUser.email).sort((a,b)=>b.createdAt-a.createdAt); }

function viewUserDashboard(){
  if(isSPUser()) return viewSpDashboard();
  const orders = myOrders();
  const ongoing = orders.filter(o=>!["delivered","rejected","cancelled"].includes(o.status)).length;
  const delivered = orders.filter(o=>o.status==="delivered").length;
  const needsAck = orders.filter(o=>o.status==="awaiting_ack").length;
  const needsConfirm = orders.filter(o=>!o.customerConfirmedAt && (o.status==="for_delivery"||o.status==="delivered")).length;
  return `
  <div class="view-head">
    <div><h2>Welcome back, ${state.currentUser.name.split(" ")[0]}</h2><p>Track every signage, tree and banner you've ordered from CGS. Each segment ships as its own ticket.</p></div>
  </div>
  <div class="kpi-row">
    <div class="kpi-card"><div class="kpi-label">Ongoing tickets</div><div class="kpi-value">${ongoing}</div></div>
    <div class="kpi-card"><div class="kpi-label">Delivered</div><div class="kpi-value">${delivered}</div></div>
    <div class="kpi-card ${needsAck?'warn':''}"><div class="kpi-label">Needs your acknowledgement</div><div class="kpi-value">${needsAck}</div></div>
    <div class="kpi-card ${needsConfirm?'warn':''}"><div class="kpi-label">Needs delivery confirmation</div><div class="kpi-value">${needsConfirm}</div></div>
  </div>
  <h3 class="section-title">Order history</h3>
  ${orders.length===0 ? emptyState("No orders yet","Visit the Shop tab to place your first order.") :
    orders.map(o=>orderCardUser(o)).join("")}
  `;
}

function orderCardUser(o){
  if(isSPOrder(o)) return spOrderCardUser(o);
  return `<div class="ticket-card">
    <div class="ticket-top">
      <div>
        <div class="ticket-id">${o.id} · ${o.segment} ${ticketMetaBadges(o)} · ${fmtDate(o.createdAt)}</div>
        <div class="ticket-title">${o.township}</div>
        <div class="ticket-meta">${o.items.length} item type(s) · ${peso(orderTotal(o))}${o.drNumber?` · DR ${o.drNumber}`:""}${o.bttNumber?` · BTT ${o.bttNumber}`:""}</div>
      </div>
      <span class="status-badge ${STATUS_CLASS[o.status]}">${o.late?"Late delivery":STATUS_LABEL[o.status]}</span>
    </div>
    ${stageTracker(o)}
    <div class="ticket-items">
      ${o.items.map(i=>`<div class="ticket-item-row"><span>${i.name} × ${i.qty} ${i.oum}</span><span>${itemAvailLabel(i)}</span></div>`).join("")}
    </div>
    ${timelineHTML(o)}
    ${billingChipHTML(o)}
    ${o.adminRemark ? `<div class="remark-box"><strong>CGS note:</strong> ${o.adminRemark}</div>` : ""}
    ${(o.status==="awaiting_ack" || o.status==="new") ? `<div class="ticket-actions">${o.status==="awaiting_ack"?`<button class="btn btn-primary btn-sm" data-ack="${o.id}">Acknowledge &amp; proceed</button>`:""}<button class="btn btn-ghost btn-sm" data-cancel-order="${o.id}">Cancel order</button></div>` : ""}
    ${!o.customerConfirmedAt && (o.status==="for_delivery"||o.status==="delivered") ? `<div class="ticket-actions"><button class="btn btn-primary btn-sm" data-confirm-delivery="${o.id}">Confirm delivery received</button></div>` : ""}
  </div>`;
}

function viewUserShop(){
  return `
  <div class="view-head">
    <div><h2>Shop CGS items</h2><p>${isSPUser()?"Pick what you need and tell us any customization or special request. CGS will send you a cost proposal — prices are quoted per project.":"Search, add to cart and check out — just like ordering online. Items from different segments become separate tickets."}</p></div>
  </div>
  <div class="shop-toolbar">
    <input class="search-input" id="shop-search" placeholder="Search items…" value="${shopState.q}" />
    <button class="chip ${shopState.segment==='ALL'?'active':''}" data-seg="ALL">All</button>
    ${ALL_SEGMENTS.map(s=>`<button class="chip ${shopState.segment===s?'active':''}" data-seg="${s}">${s.charAt(0)+s.slice(1).toLowerCase()}</button>`).join("")}
  </div>
  <div class="item-grid" id="item-grid">${renderItemGrid()}</div>
  `;
}
const shopState = { q:"", segment:"ALL" };
function renderItemGrid(){
  const items = CATALOG.filter(it=>
    (shopState.segment==="ALL"||it.segment===shopState.segment) &&
    it.name.toLowerCase().includes(shopState.q.toLowerCase())
  );
  if(items.length===0) return emptyState("No items match","Try a different search or category.");
  if(isSPUser()) return items.map(it=>{
    const inCart = state.spCart.filter(l=>l.itemId===it.id).reduce((s,l)=>s+l.qty,0);
    return `<div class="item-card">
      <div class="item-thumb">${itemImageHTML(it)}</div>
      <div class="item-body">
        <div class="item-segment">${it.segment}</div>
        <div class="item-name">${it.name}</div>
        <div class="item-oum muted" style="font-size:12px;">per ${it.oum} · price quoted by CGS</div>
        <div class="item-foot"><button class="add-btn ${inCart?'added':''}" data-sp-add="${it.id}">${inCart?`In cart (${inCart}) · add another`:"Add to cart"}</button></div>
      </div>
    </div>`;
  }).join("");
  return items.map(it=>{
    const qty = cartQty(it.id);
    return `<div class="item-card">
      <div class="item-thumb">${itemImageHTML(it)}</div>
      <div class="item-body">
        <div class="item-segment">${it.segment}</div>
        <div class="item-name">${it.name}</div>
        <div class="item-price">${peso(it.rate)}<span class="item-oum"> / ${it.oum}</span></div>
        <div class="stock-line">${stockBadgeHTML(it)}</div>
        <div class="adv-note" id="adv-${it.id}">${advanceNote(it, qty||1, true)}</div>
        <div class="item-foot">
          <div class="qty-stepper">
            <button data-shop-dec="${it.id}">−</button><span id="qty-${it.id}">${qty||1}</span><button data-shop-inc="${it.id}">+</button>
          </div>
          <button class="add-btn ${qty?'added':''}" data-add="${it.id}">${qty?`In cart (${qty})`:(stockNum(it)<=0?"Advance order":"Add to cart")}</button>
        </div>
      </div>
    </div>`;
  }).join("");
}
const draftQty = {};
function refreshAdvNote(id){
  const it = CATALOG.find(c=>c.id===id), el = document.getElementById("adv-"+id);
  if(it && el) el.textContent = advanceNote(it, draftQty[id]||cartQty(id)||1, true);
}
function afterRenderShop(){
  document.querySelectorAll("[data-sp-add]").forEach(b=>b.addEventListener("click", ()=>openSpAddModal(b.dataset.spAdd)));
  document.getElementById("shop-search").addEventListener("input", e=>{ shopState.q=e.target.value; document.getElementById("item-grid").innerHTML = renderItemGrid(); afterRenderShop(); });
  document.querySelectorAll("[data-seg]").forEach(b=>b.addEventListener("click", ()=>{ shopState.segment=b.dataset.seg; render(); }));
  document.querySelectorAll("[data-shop-inc]").forEach(b=>b.addEventListener("click", ()=>{
    const id=b.dataset.shopInc; draftQty[id]=(draftQty[id]|| (cartQty(id)||1))+1; document.getElementById("qty-"+id).textContent=draftQty[id]; refreshAdvNote(id);
  }));
  document.querySelectorAll("[data-shop-dec]").forEach(b=>b.addEventListener("click", ()=>{
    const id=b.dataset.shopDec; draftQty[id]=Math.max(1,(draftQty[id]|| (cartQty(id)||1))-1); document.getElementById("qty-"+id).textContent=draftQty[id]; refreshAdvNote(id);
  }));
  document.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click", ()=>{
    const id=b.dataset.add; const q = draftQty[id] || parseInt(document.getElementById("qty-"+id).textContent,10) || 1;
    setCartQty(id, cartQty(id) + q);
    delete draftQty[id];
    toast("Added to cart.");
    document.getElementById("item-grid").innerHTML = renderItemGrid(); afterRenderShop();
  }));
}

function viewUserAck(){
  const orders = myOrders().filter(o=>o.status==="awaiting_ack");
  return `
  <div class="view-head"><div><h2>Acknowledge orders</h2><p>CGS has confirmed item availability — review and acknowledge to send these into preparation.</p></div></div>
  ${orders.length===0 ? emptyState("Nothing waiting on you","Orders will appear here once CGS confirms availability.") : orders.map(o=>orderCardUser(o)).join("")}
  `;
}

function viewUserConfirm(){
  const orders = myOrders().filter(o=>!o.customerConfirmedAt && (o.status==="for_delivery"||o.status==="delivered"));
  return `
  <div class="view-head"><div><h2>Confirm delivery</h2><p>Tag each ticket once the items have physically arrived. This is just for your own record — CGS logs the official release and delivery time separately for billing, so confirm whenever suits you, even a few days later.</p></div></div>
  ${orders.length===0 ? emptyState("Nothing to confirm right now","Tickets out for delivery will appear here until you confirm them.") : orders.map(o=>orderCardUser(o)).join("")}
  `;
}

function afterRenderUser(){
  document.querySelectorAll("[data-ack]").forEach(b=>b.addEventListener("click", ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.ack);
    o.status = "preparation"; o.prepStatus="ongoing"; o.ackAt = Date.now();
    toast(`Ticket ${o.id} acknowledged — now in preparation.`);
    render();
  }));
  document.querySelectorAll("[data-cancel-order]").forEach(b=>b.addEventListener("click", ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.cancelOrder);
    if(!o || !["new","awaiting_ack","sp_pricing","sp_revision","sp_approver1","sp_approver2","sp_client"].includes(o.status)) return;
    if(!confirm(`Cancel ticket ${o.id}?${isSPOrder(o)?"":" Any stock set aside for it will be released."}`)) return;
    const back = releaseOrderStock(o);
    o.status = "cancelled"; o.cancelledAt = Date.now(); o.cancelledBy = "requester";
    o.adminRemark = "Cancelled by the requester.";
    toast(`Ticket ${o.id} cancelled.${back?` ${back} item(s) returned to stock.`:""}`);
    render();
  }));
  document.querySelectorAll("[data-confirm-delivery]").forEach(b=>b.addEventListener("click", ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.confirmDelivery);
    o.customerConfirmedAt = Date.now();
    toast(`Thanks — ${o.id} marked as received on your side.`);
    render();
  }));
}

/* ============================================================
   ADMIN VIEWS
   ============================================================ */
function viewAdminOverview(){
  const orders = state.orders;
  const ongoing = orders.filter(o=>!["delivered","rejected","cancelled"].includes(o.status)).length;
  const closed = orders.filter(o=>o.status==="delivered").length;
  const overdue = orders.filter(o=>o.status==="new" && hoursBetween(o.createdAt, Date.now())>48);
  const delivered = orders.filter(o=>o.deliveredAt);
  const avgH = delivered.length ? delivered.reduce((s,o)=>s+hoursBetween(o.createdAt,o.deliveredAt),0)/delivered.length : 0;
  const totalSales = orders.reduce((s,o)=>s+orderTotal(o),0);
  return `
  <div class="view-head"><div><h2>CGS operations overview</h2><p>Live status across the order-to-delivery pipeline.</p>
      <p class="muted" style="font-size:12px;margin-top:6px;">${CGS_SHEETS.enabled() ? "🟢 Connected to Google Sheets — changes save automatically." : "⚪ Not connected to Google Sheets — running on local demo data. Add your Apps Script Web App URL in config.js to enable live persistence."}</p>
    </div>
    <button class="btn btn-ghost btn-sm" id="sync-sheets-btn">⇄ Export snapshot (.csv)</button>
  </div>
  <div class="kpi-row">
    <div class="kpi-card"><div class="kpi-label">Ongoing tickets</div><div class="kpi-value">${ongoing}</div></div>
    <div class="kpi-card"><div class="kpi-label">Closed tickets</div><div class="kpi-value">${closed}</div></div>
    <div class="kpi-card"><div class="kpi-label">Total tickets</div><div class="kpi-value">${orders.length}</div></div>
    <div class="kpi-card"><div class="kpi-label">Avg. order → delivery</div><div class="kpi-value">${avgH?((avgH/24).toFixed(1)+"d"):"—"}</div></div>
    <div class="kpi-card ${overdue.length?'warn':''}"><div class="kpi-label">Unconfirmed &gt;48 hrs</div><div class="kpi-value">${overdue.length}</div></div>
    <div class="kpi-card"><div class="kpi-label">Catalog value ordered</div><div class="kpi-value" style="font-size:22px;">${peso(totalSales)}</div></div>
  </div>
  ${overdue.length? `<h3 class="section-title">⚠ Overdue unconfirmed orders</h3>` + overdue.map(o=>orderCardAdmin(o)).join("") : ""}
  <h3 class="section-title">Pipeline snapshot</h3>
  <div class="table-wrap"><table>
    <thead><tr><th>Stage</th><th>Tickets</th></tr></thead>
    <tbody>
      ${["new","awaiting_ack","preparation","ready_for_btt","ready_for_dr","for_delivery","delivered"].map(s=>
        `<tr><td>${STATUS_LABEL[s]}</td><td>${orders.filter(o=>o.status===s).length}</td></tr>`).join("")}
    </tbody>
  </table></div>
  <p class="muted" style="font-size:11.5px;margin-top:16px;max-width:640px;">Backend note: this prototype keeps everything in memory. In production, every write above (new ticket, confirmation, DR/BTT assignment, time logs) would call a Google Apps Script Web App bound to the CGS Sheet, so Sheets stays the source of truth and the Telegram/manual steps disappear.</p>
  `;
}
function afterRenderAdminOverview(){
  document.getElementById("sync-sheets-btn").addEventListener("click", syncToSheets);
}

function feeSummaryHTML(o){
  if(!o.feeBreakdown) return "";
  const fb = o.feeBreakdown;
  if(o.deliveryType==="A"){
    return `<div class="fee-box">
      <div class="fee-row"><span>Distinct townships on trip</span><span>${fb.townships}</span></div>
      <div class="fee-row"><span>Hours logged</span><span>${fb.hours.toFixed(1)} hrs</span></div>
      <div class="fee-row"><span>Base fee</span><span>${peso(fb.base)}</span></div>
      <div class="fee-row"><span>Overtime (over 4-hr allowance)</span><span>${fb.overtimeHours.toFixed(1)} hrs → ${peso(fb.overtimeFee)}</span></div>
      <div class="fee-row"><span>Overtime split per township</span><span>${peso(fb.perTownshipOvertime)}</span></div>
      <div class="fee-row total"><span>Total this leg</span><span>${peso(fb.total)}</span></div>
    </div>`;
  }
  return `<div class="fee-box">
    <div class="fee-row"><span>Distinct townships on trip</span><span>${fb.townships}</span></div>
    <div class="fee-row"><span>Hours logged</span><span>${fb.hours.toFixed(1)} hrs</span></div>
    <div class="fee-row total"><span>Delivery fee this leg (₱3,800 × ${fb.townships})</span><span>${peso(fb.fee)}</span></div>
  </div>`;
}
function orderCardAdmin(o, actionsHTML){
  return `<div class="ticket-card">
    <div class="ticket-top">
      <div>
        <div class="ticket-id">${o.id} · ${o.segment} ${ticketMetaBadges(o)} · ${fmtDate(o.createdAt)}</div>
        <div class="ticket-title">${o.userName} <span class="muted">— ${o.userPosition}</span></div>
        <div class="ticket-meta">${o.township} · ${o.items.length} item type(s) · ${isSPOrder(o) ? spMoneyLabel(o) : peso(orderTotal(o))}${o.drNumber?` · DR ${o.drNumber}`:""}</div>
      </div>
      <span class="status-badge ${STATUS_CLASS[o.status]}">${o.late?"Late delivery":STATUS_LABEL[o.status]}</span>
    </div>
    <div class="ticket-items">
      ${isSPOrder(o) ? spItemRowsHTML(o) : o.items.map(i=>`<div class="ticket-item-row"><span>${i.name} × ${i.qty} ${i.oum}</span><span>${itemAvailLabel(i)}</span></div>`).join("")}
    </div>
    ${timelineHTML(o)}
    ${feeSummaryHTML(o)}
    ${o.adminRemark ? `<div class="remark-box">${o.adminRemark}</div>` : ""}
    ${actionsHTML ? `<div class="ticket-actions">${actionsHTML}</div>` : ""}
  </div>`;
}

function emptyState(title, sub){ return `<div class="empty-state"><h4>${title}</h4><p>${sub}</p></div>`; }

/* --- New Orders --- */
function viewAdminNew(){
  const orders = state.orders.filter(o=>o.status==="new");
  return `<div class="view-head"><div><h2>New orders</h2><p>Review item availability, then confirm or reject. Each ticket is a single segment.</p></div></div>
  ${orders.length===0?emptyState("No new orders","New requests from users will land here."):
    orders.map(o=>orderCardAdmin(o, `<button class="btn btn-primary btn-sm" data-review="${o.id}">Review &amp; confirm</button><button class="btn btn-danger btn-sm" data-reject="${o.id}">Reject order</button>`)).join("")}`;
}
function afterRenderAdminNew(){
  document.querySelectorAll("[data-review]").forEach(b=>b.addEventListener("click", ()=>openReviewModal(b.dataset.review)));
  document.querySelectorAll("[data-reject]").forEach(b=>b.addEventListener("click", ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.reject);
    const back = releaseOrderStock(o);
    o.status="rejected"; o.adminRemark="Order rejected — CGS does not carry these items.";
    toast(`Order ${o.id} rejected.${back?` ${back} item(s) returned to stock.`:""}`, true); render();
  }));
}
function openReviewModal(orderId){
  const o = state.orders.find(o=>o.id===orderId);
  o.items.forEach(i=>{ if(i.advance && !i.avail) i.avail = "production"; }); // advance orders start as "In production"
  const panel = document.getElementById("generic-modal-panel");
  panel.innerHTML = `
    <div class="modal-head"><h3>Review ${o.id}</h3><button class="icon-btn" data-close="generic-modal">✕</button></div>
    <div class="modal-body">
      <p class="muted" style="font-size:13px;">Mark each item's availability. In-production items need an availability date — the item auto-moves to its own ticket and into preparation on that date, and the requester is notified. Unavailable items are logged to history and go no further.</p>
      ${o.items.map((i,idx)=>`
        <div class="avail-row">
          <div class="ai-name">${i.name} <span class="muted">× ${i.qty} ${i.oum}</span></div>
          <div class="avail-toggle" data-row="${idx}">
            <button type="button" class="sel-avail ${i.avail==='available'?'on':''}" data-set="available">Available</button>
            <button type="button" class="sel-prod ${i.avail==='production'?'on':''}" data-set="production">In production</button>
            <button type="button" class="sel-none ${i.avail==='unavailable'?'on':''}" data-set="unavailable">Unavailable</button>
          </div>
          <div class="avail-eta ${i.avail==='production'?'':'hidden'}" data-eta-row="${idx}">
            <label>Available on <input type="date" class="eta-input" data-eta="${idx}" value="${i.etaDate||''}"/></label>
          </div>
        </div>`).join("")}
      <label>Remarks for the customer
        <textarea id="review-remark" rows="3" placeholder="e.g. Directional signage still in production, ETA 2 weeks.">${o.adminRemark||""}</textarea>
      </label>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-close="generic-modal">Cancel</button>
      <button class="btn btn-primary" id="confirm-review-btn">Send for customer approval</button>
    </div>`;
  panel.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click", ()=>closeModal("generic-modal")));
  panel.querySelectorAll(".avail-toggle").forEach(group=>{
    group.querySelectorAll("button").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const idx = +group.dataset.row;
        o.items[idx].avail = btn.dataset.set;
        if(btn.dataset.set!=="production") o.items[idx].etaDate = null;
        group.querySelectorAll("button").forEach(x=>x.classList.remove("on"));
        btn.classList.add("on");
        const etaRow = panel.querySelector(`[data-eta-row="${idx}"]`);
        if(etaRow) etaRow.classList.toggle("hidden", btn.dataset.set!=="production");
      });
    });
  });
  panel.querySelectorAll(".eta-input").forEach(inp=>{
    inp.addEventListener("change", ()=>{ o.items[+inp.dataset.eta].etaDate = inp.value || null; });
  });
  document.getElementById("confirm-review-btn").addEventListener("click", ()=>{
    if(o.items.some(i=>!i.avail)){ toast("Mark availability for every item first.", true); return; }
    if(o.items.some(i=>i.avail==="production" && !i.etaDate)){ toast("Set an availability date for every item in production.", true); return; }
    o.items.forEach(i=>reconcileLineStock(i)); // give stock back for lines that will not ship from stock
    o.items.forEach(i=>{ if(i.avail==="unavailable") logUnavailable(o, i); });
    o.adminRemark = document.getElementById("review-remark").value.trim() || "All items reviewed. Please acknowledge to proceed.";
    o.status = "awaiting_ack"; o.confirmedAt = Date.now();
    closeModal("generic-modal");
    toast(`Order ${o.id} sent to the customer for acknowledgement.`);
    CGS_SHEETS.pokeReleaseCheck();
    render();
  });
  openModal("generic-modal");
}

/* --- Confirmation of Orders --- */
function viewAdminConfirm(){
  const orders = state.orders.filter(o=>o.status==="awaiting_ack");
  return `<div class="view-head"><div><h2>Confirmation of orders</h2><p>Waiting for the customer to acknowledge confirmed availability.</p></div></div>
  ${orders.length===0?emptyState("Nothing pending","Orders you've reviewed will wait here for customer acknowledgement."):
    orders.map(o=>orderCardAdmin(o)).join("")}`;
}

/* --- Preparation --- */
function viewAdminPrep(){
  const orders = state.orders.filter(o=>o.status==="preparation");
  return `<div class="view-head"><div><h2>Preparation of orders</h2><p>Move each ticket through prep, then issue its DR number.</p></div></div>
  ${orders.length===0?emptyState("Nothing in preparation","Acknowledged orders will appear here."):
    orders.map(o=>{
      const s = o.prepStatus||"ongoing";
      return orderCardAdmin(o, `
        <div class="avail-toggle">
          <button class="btn btn-sm ${s==='waiting_supplies'?'btn-amber':'btn-ghost'}" data-prep="${o.id}" data-set="waiting_supplies">Waiting for supplies</button>
          <button class="btn btn-sm ${s==='ongoing'?'btn-amber':'btn-ghost'}" data-prep="${o.id}" data-set="ongoing">Ongoing</button>
        </div>
        <button class="btn btn-primary btn-sm" data-prep-done="${o.id}">Mark done — issue DR number</button>
      `);
    }).join("")}`;
}
function afterRenderAdminPrep(){
  document.querySelectorAll("[data-prep]").forEach(b=>b.addEventListener("click", ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.prep); o.prepStatus = b.dataset.set; render();
  }));
  document.querySelectorAll("[data-prep-done]").forEach(b=>b.addEventListener("click", ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.prepDone);
    o.drNumber = "DR-2026-"+String(1000+state.orders.indexOf(o));
    o.prepDoneAt = Date.now(); o.status="ready_for_btt";
    toast(`${o.id} prepared — DR number ${o.drNumber} issued.`); render();
  }));
}

/* --- BTT Assignment --- */
function viewAdminBTT(){
  const orders = state.orders.filter(o=>o.status==="ready_for_btt");
  return `<div class="view-head"><div><h2>BTT assignment</h2><p>Assign a delivery date and vehicle. Tickets sharing a date and vehicle — even across townships or segments — can share one BTT number. Use "No BTT required" to skip numbering while still scheduling date and vehicle.</p></div></div>
  ${orders.length===0?emptyState("No tickets waiting","Tickets with a DR number will appear here."):
    orders.map(o=>orderCardAdmin(o, `
      <input type="date" id="date-${o.id}" style="border:1.5px solid var(--sand); border-radius:8px; padding:7px 10px;" />
      <select id="veh-${o.id}" style="border:1.5px solid var(--sand); border-radius:8px; padding:7px 10px; font-size:12.5px;">
        ${VEHICLES.map(v=>`<option value="${v.id}">${v.name} — ${v.driver}</option>`).join("")}
      </select>
      <button class="btn btn-primary btn-sm" data-assign-btt="${o.id}">Assign BTT</button>
      <button class="btn btn-ghost btn-sm" data-no-btt="${o.id}">No BTT required</button>
    `)).join("")}`;
}
function afterRenderAdminBTT(){
  document.querySelectorAll("[data-assign-btt]").forEach(b=>b.addEventListener("click", ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.assignBtt);
    const date = document.getElementById("date-"+o.id).value;
    if(!date){ toast("Pick a delivery date first.", true); return; }
    const vehicleId = document.getElementById("veh-"+o.id).value;
    const twin = state.orders.find(x=>x!==o && x.bttNumber && !x.noBtt && x.deliveryDate===date && x.vehicleId===vehicleId);
    o.bttNumber = twin ? twin.bttNumber : "BTT-2026-"+String(2000+state.orders.indexOf(o));
    o.noBtt = false; o.deliveryDate = date; o.vehicleId = vehicleId; o.bttAt = Date.now(); o.status = "ready_for_dr";
    toast(`${o.id} assigned to ${o.bttNumber}${twin?" (shared with "+twin.id+")":""}.`); render();
  }));
  document.querySelectorAll("[data-no-btt]").forEach(b=>b.addEventListener("click", ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.noBtt);
    const date = document.getElementById("date-"+o.id).value;
    if(!date){ toast("Pick a delivery date first.", true); return; }
    o.noBtt = true; o.bttNumber = null; o.deliveryDate = date; o.vehicleId = document.getElementById("veh-"+o.id).value;
    o.bttAt = Date.now(); o.status = "ready_for_dr";
    toast(`${o.id} scheduled without a BTT number.`); render();
  }));
}

function mergeDrLines(lines){
  const m = {};
  lines.forEach(i=>{ const k = i.name+"|"+i.oum;
    if(m[k]) m[k].qty += Number(i.qty)||0; else m[k] = { name:i.name, qty:Number(i.qty)||0, unit:i.oum, status:"COMPLETE" }; });
  return Object.values(m);
}
/* Everything the Google Doc needs — name, address, date, items and numbers come from the order. */
function drPayload(o){
  const info = isSPOrder(o) ? { legalName:o.company||o.township, address:o.deliveryAddress||"" } : townshipDetails(o.township);
  let dateStr;
  const d = o.deliveryDate ? String(o.deliveryDate).slice(0,10) : "";
  if(/^\d{4}-\d{2}-\d{2}$/.test(d)){ const [y,m,dd] = d.split("-"); dateStr = `${m}/${dd}/${y}`; }
  else { const n = new Date(); dateStr = String(n.getMonth()+1).padStart(2,"0")+"/"+String(n.getDate()).padStart(2,"0")+"/"+n.getFullYear(); }
  return {
    orderId:o.id, drNumber:o.drNumber, township: info.legalName || o.township, address: info.address || "", date: dateStr,
    items: isSPOrder(o) ? o.items.map(i=>({ name:i.name+(i.customization?" ("+i.customization+")":""), qty:Number(i.qty)||0, unit:i.oum, status:"COMPLETE" })) : mergeDrLines(o.items.filter(i=>i.avail==="available")),
    bttNumber: o.noBtt ? null : (o.bttNumber||null), iomNumber: o.iomNumber || ""
  };
}

/* --- DR Generator --- */
function viewAdminDR(){
  const orders = state.orders.filter(o=>o.status==="ready_for_dr");
  return `<div class="view-head"><div><h2>DR generator</h2><p>Print or confirm the delivery receipt. Confirming emails the customer and sends the ticket to delivery.</p></div></div>
  ${orders.length===0?emptyState("Nothing to generate","BTT-assigned tickets will appear here."):
    orders.map(o=>{ const vehicle = VEHICLES.find(v=>v.id===o.vehicleId); return `
    <div class="dr-sheet" style="margin-bottom:16px;">
      <div class="dr-head-row">
        <div><h4>DELIVERY RECEIPT</h4><span class="muted" style="font-size:12px;">Central Group Services — ${o.segment}</span></div>
        <div style="text-align:right;"><div class="ticket-id">${o.drNumber}</div><div class="ticket-id">${o.noBtt?"NO BTT REQUIRED":o.bttNumber}</div></div>
      </div>
      <div class="dr-grid">
        <div><span>Ordered by</span>${o.userName} — ${o.userPosition}</div>
        <div><span>${isSPOrder(o)?"Company":"Township"}</span>${o.township}</div>
        <div><span>Address</span>${(isSPOrder(o)?o.deliveryAddress:townshipDetails(o.township).address)||'<em class="muted">No address yet — add it under Township Addresses</em>'}</div>
        <div><span>Vehicle</span>${vehicle?vehicle.name+" — "+vehicle.driver:"—"}</div>
        <div><span>Delivery date</span>${fmtDateShort(new Date(o.deliveryDate).getTime())}</div>
      </div>
      <label style="display:block;max-width:260px;margin-bottom:14px;">IOM number
        <input value="${o.iomNumber||''}" data-iom="${o.id}" placeholder="e.g. IOM-08-2026" style="width:100%;margin-top:4px;padding:8px 10px;border:1.5px solid var(--sand);border-radius:8px;font-family:inherit;" />
      </label>
      <div class="ticket-items">
        ${o.items.filter(i=>i.avail==='available').map(i=>`<div class="ticket-item-row"><span>${i.name} × ${i.qty} ${i.oum}</span><span>${isSPOrder(o)?"":peso(i.rate*i.qty)}</span></div>`).join("")}
      </div>
      ${o.drStale?`<div class="remark-box"><strong>DR needs updating:</strong> an item came out of production after this DR was created. Regenerate it so it lists everything before you send it out.</div>`:""}
      <div class="ticket-actions">
        ${CGS_SHEETS.enabled()
          ? (o.drDocUrl
              ? `<a class="btn btn-ghost btn-sm" href="${escAttr(o.drDocUrl)}" target="_blank" rel="noopener">Review DR (Google Doc)</a>
                 <button class="btn btn-ghost btn-sm" data-print-dr="${o.id}">Print</button>
                 <button class="linklike" data-create-dr="${o.id}" style="font-size:12px;">Regenerate</button>`
              : `<button class="btn btn-ghost btn-sm" data-create-dr="${o.id}">Create DR (Google Doc)</button>`)
          : `<button class="btn btn-ghost btn-sm" onclick="window.print()">Print / Download PDF</button>`}
        <button class="btn btn-primary btn-sm" data-confirm-dr="${o.id}">Confirm &amp; send to delivery</button>
      </div>
    </div>`;}).join("")}`;
}
function afterRenderAdminDR(){
  document.querySelectorAll("[data-iom]").forEach(inp=>inp.addEventListener("change", ()=>{
    const o = state.orders.find(o=>o.id===inp.dataset.iom); o.iomNumber = inp.value.trim();
  }));
  document.querySelectorAll("[data-create-dr]").forEach(b=>b.addEventListener("click", async ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.createDr);
    if(o.drDocUrl && !o.drStale && !confirm("This creates a new Google Doc for this DR. The old one stays in your Drive. Continue?")) return;
    b.disabled = true; b.textContent = "Creating…";
    try{
      const out = await CGS_SHEETS.createDR(drPayload(o));
      o.drDocId = out.docId; o.drDocUrl = out.url; o.drDocAt = Date.now(); o.drStale = false;
      toast(`${o.drNumber} created as a Google Doc — review or print it below.`);
    }catch(err){ toast("Could not create the DR: " + err.message, true); }
    render();
  }));
  document.querySelectorAll("[data-print-dr]").forEach(b=>b.addEventListener("click", async ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.printDr);
    const label = b.textContent; b.disabled = true; b.textContent = "Preparing…";
    try{ await CGS_SHEETS.printDR(o.drDocId); }
    catch(err){ toast("Could not prepare the print: " + err.message, true); }
    b.disabled = false; b.textContent = label;
  }));
  document.querySelectorAll("[data-confirm-dr]").forEach(b=>b.addEventListener("click", ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.confirmDr);
    if(CGS_SHEETS.enabled() && !o.drDocUrl){ toast("Create the DR (Google Doc) first, then confirm.", true); return; }
    if(o.drStale){ toast("Regenerate the DR first — an item was added after it was created.", true); return; }
    o.drAt = Date.now(); o.status = "for_delivery";
    toast(`${o.id} confirmed — delivery details emailed to ${o.userEmail}.`);
    render();
  }));
}

/* --- For Delivery (grouped by BTT / trip) — admin logs release/delivery
   time directly once the DR is sent, independent of when (or whether) the
   customer taps "confirm received" on their side. Customer confirmation is
   tracked separately for the customer's own record and never blocks or
   delays the billing calculation here. --- */
function openDeliveryGroups(){
  const open = state.orders.filter(o=>o.status==="for_delivery");
  const map = {};
  open.forEach(o=>{ const k = groupKeyFor(o); (map[k]=map[k]||[]).push(o); });
  return map;
}
function viewAdminDelivery(){
  const map = openDeliveryGroups();
  const keys = Object.keys(map);
  return `<div class="view-head"><div><h2>For delivery</h2><p>Log the date &amp; time of release and of delivery as soon as the trip happens — don't wait on the customer's own confirmation, since that can come in days later and would throw off overtime billing.</p></div></div>
  ${keys.length===0?emptyState("Nothing out for delivery","DR-confirmed tickets will appear here."):
    keys.map(k=>groupCardHTML(k, map[k])).join("")}`;
}
function groupCardHTML(key, members){
  const first = members[0];
  const vehicle = VEHICLES.find(v=>v.id===first.vehicleId);
  const overdue = first.deliveryDate && new Date(first.deliveryDate).getTime() < Date.now()-1000*60*60*24;
  return `<div class="group-card">
    <div class="group-head">
      <div>
        ${first.noBtt? `<span class="nobtt-badge">NO BTT REQUIRED</span>` : `<span class="ticket-id">${first.bttNumber}</span>`}
        <div class="ticket-title" style="margin-top:4px;">${vehicle?vehicle.name:"—"} <span class="muted">— ${vehicle?vehicle.driver:""}</span></div>
        <div class="ticket-meta">Scheduled ${fmtDateShort(new Date(first.deliveryDate).getTime())}${overdue?' <strong style="color:var(--clay)">— past due</strong>':''}</div>
      </div>
    </div>
    <div class="group-sub">
      ${members.map(m=>`<div class="member-row">
        <span>${m.id} · ${m.segment} <span class="type-badge ${m.deliveryType}">TYPE ${m.deliveryType}</span> · ${m.township} · DR ${m.drNumber||'—'}</span>
        <span class="mr-status">${m.customerConfirmedAt?'✓ Customer confirmed':'Customer hasn\u2019t confirmed yet'}${overdue?` · <button class="linklike" data-reassign="${m.id}">reassign (late)</button>`:''}</span>
      </div>`).join("")}
    </div>
    <div class="ot-box">
      <div class="ot-row">
        <div class="ot-field"><label>Date &amp; time of release</label><input type="datetime-local" id="ot-from-${key}" value="${first.deliveryDate?first.deliveryDate+'T08:00':''}"/></div>
        <div class="ot-field"><label>Date &amp; time of delivery</label><input type="datetime-local" id="ot-to-${key}"/></div>
      </div>
      <div class="ot-hours">Hours: <span id="ot-hours-${key}">—</span></div>
    </div>
    ${members.filter(m=>m.deliveryType==="B").map(m=>`<div class="done-check"><input type="checkbox" id="done-${m.id}" checked/> <label for="done-${m.id}">${m.id} (${m.township}) — project completed on this visit?</label></div>`).join("")}
    <div class="ticket-actions" style="margin-top:10px;">
      <button class="btn btn-primary btn-sm" data-finalize="${key}">Compute fee &amp; finalize</button>
    </div>
  </div>`;
}
function updateOtHours(key){
  const fromEl = document.getElementById("ot-from-"+key), toEl = document.getElementById("ot-to-"+key), out = document.getElementById("ot-hours-"+key);
  if(!fromEl || !toEl || !out) return;
  if(!fromEl.value || !toEl.value){ out.textContent = "—"; return; }
  const hrs = (new Date(toEl.value) - new Date(fromEl.value)) / 3600000;
  out.textContent = hrs>0 ? hrs.toFixed(1)+" hrs" : "— (delivery must be after release)";
}
function afterRenderAdminDelivery(){
  document.querySelectorAll("[data-reassign]").forEach(b=>b.addEventListener("click", ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.reassign);
    o.status="ready_for_btt"; o.late=true; o.bttNumber=null; o.noBtt=false; o.vehicleId=null; o.deliveryDate=null;
    toast(`${o.id} sent back to BTT assignment — flagged as late.`, true); render();
  }));
  const map = openDeliveryGroups();
  Object.keys(map).forEach(key=>{
    const fromEl = document.getElementById("ot-from-"+key), toEl = document.getElementById("ot-to-"+key);
    if(fromEl && toEl){ fromEl.addEventListener("input", ()=>updateOtHours(key)); toEl.addEventListener("input", ()=>updateOtHours(key)); updateOtHours(key); }
  });
  document.querySelectorAll("[data-finalize]").forEach(b=>b.addEventListener("click", ()=>{
    const key = b.dataset.finalize;
    const members = map[key];
    const fromEl = document.getElementById("ot-from-"+key), toEl = document.getElementById("ot-to-"+key);
    if(!fromEl.value || !toEl.value){ toast("Fill in the date &amp; time of release and of delivery.", true); return; }
    const releaseAt = new Date(fromEl.value).getTime(), deliveredTs = new Date(toEl.value).getTime();
    if(deliveredTs <= releaseAt){ toast("Delivery time must be after release time.", true); return; }
    const fee = computeGroupFee(members, releaseAt, deliveredTs);
    const logId = "LOG-"+String(state.deliveryLogs.length+1).padStart(4,"0");
    state.deliveryLogs.push({ id:logId, vehicleId:members[0].vehicleId, releaseAt, deliveredAt:deliveredTs,
      bttNumber: members[0].noBtt?null:members[0].bttNumber, tickets: members.map(m=>m.id), feeTotal:fee.total, breakdown:fee.breakdown, hours:fee.hours });
    members.forEach(t=>{
      t.releaseAt=releaseAt; t.deliveredAt=deliveredTs;
      t.feeBreakdown = t.deliveryType==="A" ? fee.breakdown.A : fee.breakdown.B;
      const legFee = t.deliveryType==="A" ? (fee.breakdown.A?fee.breakdown.A.total:0) : (fee.breakdown.B?fee.breakdown.B.fee:0);
      t.totalBilled = (t.totalBilled||0) + legFee;
      if(t.deliveryType==="B"){
        const chk = document.getElementById("done-"+t.id);
        const done = chk ? chk.checked : true;
        if(done){ t.status="delivered"; }
        else {
          // Not finished: goes back through DR (and BTT) assignment so a fresh
          // DR is issued for the continuation — that re-issuance is what bills
          // the client again (delivery fee only; materials are not rebilled).
          t.status="preparation"; t.prepStatus="ongoing"; t.recurring=true; t.cycleCount=(t.cycleCount||1)+1;
          t.drNumber=null; t.prepDoneAt=null; t.bttNumber=null; t.noBtt=false; t.vehicleId=null; t.deliveryDate=null; t.late=false;
          t.adminRemark = `Cycle ${t.cycleCount-1} (${fmtDateShort(releaseAt)}) not finished — sent back for a new DR number so the ₱${legFee.toLocaleString()} delivery fee bills again next cycle. Materials were not rebilled.`;
          t.releaseAt=null; t.deliveredAt=null;
        }
      } else {
        t.status="delivered";
      }
    });
    toast(`${logId}: ${peso(fee.total)} delivery fee computed and logged.`);
    render();
  }));
}

/* --- Delivered items --- */
function viewAdminDelivered(){
  const orders = state.orders.filter(o=>o.status==="delivered");
  return `<div class="view-head"><div><h2>Delivered items</h2><p>Efficiency from order placement to delivery.</p></div>${exportButtonsHTML("delivered-items")}</div>
  <div class="table-wrap"><table>
    <thead><tr><th>Ticket</th><th>Segment</th><th>Customer</th><th>Township</th><th>DR</th><th>BTT</th><th>Released</th><th>Delivered</th><th>Turnaround</th><th>Billed</th></tr></thead>
    <tbody>
      ${orders.length===0?`<tr><td colspan="10" class="muted">No delivered tickets yet.</td></tr>`:
      orders.map(o=>`<tr><td>${o.id}</td><td>${o.segment}</td><td>${o.userName}</td><td>${o.township}</td><td>${o.drNumber||'—'}</td><td>${o.noBtt?'No BTT':(o.bttNumber||'—')}</td><td>${fmtDate(o.releaseAt)}</td><td>${fmtDate(o.deliveredAt)}</td><td>${turnaroundLabel(o)}</td><td>${peso(o.totalBilled)}</td></tr>`).join("")}
    </tbody>
  </table></div>`;
}

/* --- Overall history (with filters + total sales) --- */
const historyFilter = { segment:"ALL", township:"ALL", from:"", to:"" };
function viewAdminHistory(){
  const orders = state.orders.filter(o=>
    (historyFilter.segment==="ALL"||o.segment===historyFilter.segment) &&
    (historyFilter.township==="ALL"||o.township===historyFilter.township) &&
    (!historyFilter.from && !historyFilter.to ? true : inDateRange(o.createdAt, historyFilter.from, historyFilter.to))
  ).sort((a,b)=>b.createdAt-a.createdAt);
  const totalSales = orders.reduce((s,o)=>s+orderTotal(o),0);
  return `<div class="view-head"><div><h2>Overall delivery history</h2><p>Every ticket, at every stage. Filter to see totals for a segment, township or date range.</p></div>${exportButtonsHTML("overall-history")}</div>
  <div class="filter-bar">
    <label>Segment <select id="hf-segment">${["ALL",...ALL_SEGMENTS].map(s=>`<option value="${s}" ${historyFilter.segment===s?'selected':''}>${s}</option>`).join("")}</select></label>
    <label>Township <select id="hf-township">${["ALL",...TOWNSHIPS].map(t=>`<option value="${t}" ${historyFilter.township===t?'selected':''}>${t}</option>`).join("")}</select></label>
    <label>From <input type="date" id="hf-from" value="${historyFilter.from}"/></label>
    <label>To <input type="date" id="hf-to" value="${historyFilter.to}"/></label>
    <button class="btn btn-ghost btn-sm" id="hf-clear">Clear filters</button>
  </div>
  <div class="kpi-row" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));">
    <div class="kpi-card"><div class="kpi-label">Tickets matching filter</div><div class="kpi-value">${orders.length}</div></div>
    <div class="kpi-card"><div class="kpi-label">Total sales (filtered)</div><div class="kpi-value" style="font-size:24px;">${peso(totalSales)}</div></div>
  </div>
  <div class="table-wrap"><table>
    <thead><tr><th>Ticket</th><th>Segment</th><th>Customer</th><th>Township</th><th>Placed</th><th>Status</th><th>Total</th></tr></thead>
    <tbody>
      ${orders.length===0?`<tr><td colspan="7" class="muted">No tickets match this filter.</td></tr>`:orders.map(o=>`<tr><td>${o.id}</td><td>${o.segment}</td><td>${o.userName}</td><td>${o.township}</td><td>${fmtDateShort(o.createdAt)}</td>
      <td><span class="status-badge ${STATUS_CLASS[o.status]}">${o.late?"Late":STATUS_LABEL[o.status]}</span></td><td>${peso(orderTotal(o))}</td></tr>`).join("")}
    </tbody>
  </table></div>`;
}
function afterRenderAdminHistory(){
  document.getElementById("hf-segment").addEventListener("change", e=>{ historyFilter.segment=e.target.value; render(); });
  document.getElementById("hf-township").addEventListener("change", e=>{ historyFilter.township=e.target.value; render(); });
  document.getElementById("hf-from").addEventListener("change", e=>{ historyFilter.from=e.target.value; render(); });
  document.getElementById("hf-to").addEventListener("change", e=>{ historyFilter.to=e.target.value; render(); });
  document.getElementById("hf-clear").addEventListener("click", ()=>{ historyFilter.segment="ALL"; historyFilter.township="ALL"; historyFilter.from=""; historyFilter.to=""; render(); });
}

/* --- Edit Orders (free-form admin edit) --- */
function viewAdminEdit(){
  const orders = [...state.orders].sort((a,b)=>b.createdAt-a.createdAt);
  return `<div class="view-head"><div><h2>Edit orders</h2><p>Correct DR, IOM, BTT numbers or other details on any ticket.</p></div></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Ticket</th><th>Segment</th><th>Township</th><th>Status</th><th>DR</th><th>IOM</th><th>BTT</th><th></th></tr></thead>
    <tbody>
      ${orders.map(o=>`<tr><td>${o.id}</td><td>${o.segment}</td><td>${o.township}</td><td>${STATUS_LABEL[o.status]}</td><td>${o.drNumber||'—'}</td><td>${o.iomNumber||'—'}</td><td>${o.noBtt?'No BTT':(o.bttNumber||'—')}</td>
      <td><button class="btn btn-ghost btn-sm" data-edit-order="${o.id}">Edit</button></td></tr>`).join("")}
    </tbody>
  </table></div>`;
}
function afterRenderAdminEdit(){
  document.querySelectorAll("[data-edit-order]").forEach(b=>b.addEventListener("click", ()=>openEditOrderModal(b.dataset.editOrder)));
}
function openEditOrderModal(orderId){
  const o = state.orders.find(o=>o.id===orderId);
  const panel = document.getElementById("generic-modal-panel");
  const statusOptions = Object.keys(STATUS_LABEL);
  panel.innerHTML = `
    <div class="modal-head"><h3>Edit ${o.id}</h3><button class="icon-btn" data-close="generic-modal">✕</button></div>
    <div class="modal-body">
      <div class="form-grid-2">
        <label>DR number <input id="eo-dr" value="${o.drNumber||''}"/></label>
        <label>IOM number <input id="eo-iom" value="${o.iomNumber||''}"/></label>
      </div>
      <div class="form-grid-2">
        <label>BTT number <input id="eo-btt" value="${o.noBtt?'':(o.bttNumber||'')}" ${o.noBtt?'placeholder="No BTT required"':''}/></label>
        <label>Delivery date <input type="date" id="eo-date" value="${o.deliveryDate||''}"/></label>
      </div>
      ${isSPOrder(o) ? `<label>Company <input id="eo-township" value="${escAttr(o.township)}" disabled /></label>` : `<label>Township <select id="eo-township">${TOWNSHIPS.map(t=>`<option ${o.township===t?'selected':''}>${t}</option>`).join("")}</select></label>`}
      <label>Status <select id="eo-status">${statusOptions.map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${STATUS_LABEL[s]}</option>`).join("")}</select></label>
      <label>Admin remarks <textarea id="eo-remark" rows="2">${o.adminRemark||''}</textarea></label>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close="generic-modal">Cancel</button><button class="btn btn-primary" id="save-edit-order-btn">Save changes</button></div>`;
  panel.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click", ()=>closeModal("generic-modal")));
  document.getElementById("save-edit-order-btn").addEventListener("click", ()=>{
    o.drNumber = document.getElementById("eo-dr").value.trim() || null;
    o.iomNumber = document.getElementById("eo-iom").value.trim() || null;
    const bttVal = document.getElementById("eo-btt").value.trim();
    o.bttNumber = bttVal || null; o.noBtt = !bttVal && o.noBtt;
    o.deliveryDate = document.getElementById("eo-date").value || null;
    if(!isSPOrder(o)) o.township = document.getElementById("eo-township").value;
    const prevStatus = o.status;
    o.status = document.getElementById("eo-status").value;
    if(isVoidOrder(o) && !isVoidOrder({status:prevStatus})) releaseOrderStock(o); // cancelled/rejected here => stock goes back
    o.adminRemark = document.getElementById("eo-remark").value.trim();
    closeModal("generic-modal"); toast(`${o.id} updated.`); render();
  });
  openModal("generic-modal");
}

/* --- Vehicle summary --- */
const vehicleFilter = { vehicleId:"ALL", from:"", to:"" };
function viewAdminVehicles(){
  const logs = state.deliveryLogs.filter(l=>
    (vehicleFilter.vehicleId==="ALL"||l.vehicleId===vehicleFilter.vehicleId) &&
    (!vehicleFilter.from && !vehicleFilter.to ? true : inDateRange(l.releaseAt, vehicleFilter.from, vehicleFilter.to))
  );
  const byVehicle = {};
  VEHICLES.forEach(v=>byVehicle[v.id]={vehicle:v, trips:0, hours:0, amount:0, overtimeHours:0});
  logs.forEach(l=>{
    const row = byVehicle[l.vehicleId]; if(!row) return;
    row.trips++; row.hours += l.hours; row.amount += l.feeTotal;
    if(l.breakdown.A) row.overtimeHours += l.breakdown.A.overtimeHours;
  });
  return `<div class="view-head"><div><h2>Vehicle summary</h2><p>Delivery history per vehicle — hours on the road, amount billed, and overtime hours incurred.</p></div>${exportButtonsHTML("vehicle-summary")}</div>
  <div class="filter-bar">
    <label>Vehicle <select id="vf-vehicle">${["ALL",...VEHICLES.map(v=>v.id)].map(id=>`<option value="${id}" ${vehicleFilter.vehicleId===id?'selected':''}>${id==="ALL"?"All vehicles":VEHICLES.find(v=>v.id===id).name}</option>`).join("")}</select></label>
    <label>From <input type="date" id="vf-from" value="${vehicleFilter.from}"/></label>
    <label>To <input type="date" id="vf-to" value="${vehicleFilter.to}"/></label>
    <button class="btn btn-ghost btn-sm" id="vf-clear">Clear filters</button>
    <button class="btn btn-primary btn-sm" id="add-vehicle-btn" style="margin-left:auto;">+ Add vehicle &amp; driver</button>
  </div>
  <div class="table-wrap"><table>
    <thead><tr><th>Vehicle</th><th>Driver</th><th>Plate</th><th>Deliveries</th><th>Hours on road</th><th>Exceeded hours</th><th>Amount billed</th></tr></thead>
    <tbody>
      ${Object.values(byVehicle).map(r=>`<tr><td>${r.vehicle.name}</td><td>${r.vehicle.driver}</td><td>${r.vehicle.plate}</td><td>${r.trips}</td><td>${r.hours.toFixed(1)}</td><td>${r.overtimeHours.toFixed(1)}</td><td>${peso(r.amount)}</td></tr>`).join("")}
    </tbody>
  </table></div>
  <h3 class="section-title">Trip log</h3>
  <div class="table-wrap"><table>
    <thead><tr><th>Log</th><th>Vehicle</th><th>Released</th><th>Delivered</th><th>Hours</th><th>BTT</th><th>Tickets</th><th>Fee</th></tr></thead>
    <tbody>
      ${logs.length===0?`<tr><td colspan="8" class="muted">No finalized deliveries in range.</td></tr>`:logs.map(l=>{
        const v = VEHICLES.find(v=>v.id===l.vehicleId);
        return `<tr><td>${l.id}</td><td>${v?v.name:'—'}</td><td>${fmtDate(l.releaseAt)}</td><td>${fmtDate(l.deliveredAt)}</td><td>${l.hours.toFixed(1)} hrs</td><td>${l.bttNumber||'No BTT'}</td><td>${l.tickets.join(", ")}</td><td>${peso(l.feeTotal)}</td></tr>`;
      }).join("")}
    </tbody>
  </table></div>`;
}
function afterRenderAdminVehicles(){
  document.getElementById("vf-vehicle").addEventListener("change", e=>{ vehicleFilter.vehicleId=e.target.value; render(); });
  document.getElementById("vf-from").addEventListener("change", e=>{ vehicleFilter.from=e.target.value; render(); });
  document.getElementById("vf-to").addEventListener("change", e=>{ vehicleFilter.to=e.target.value; render(); });
  document.getElementById("vf-clear").addEventListener("click", ()=>{ vehicleFilter.vehicleId="ALL"; vehicleFilter.from=""; vehicleFilter.to=""; render(); });
  document.getElementById("add-vehicle-btn").addEventListener("click", ()=>{
    const panel = document.getElementById("generic-modal-panel");
    panel.innerHTML = `
      <div class="modal-head"><h3>Add vehicle &amp; driver</h3><button class="icon-btn" data-close="generic-modal">✕</button></div>
      <div class="modal-body">
        <label>Vehicle name <input id="nv-name" placeholder="e.g. Boom Truck 3 — Isuzu Forward"/></label>
        <div class="form-grid-2">
          <label>Plate number <input id="nv-plate" placeholder="ABC-1234"/></label>
          <label>Driver name <input id="nv-driver" placeholder="Full name"/></label>
        </div>
      </div>
      <div class="modal-foot"><button class="btn btn-ghost" data-close="generic-modal">Cancel</button><button class="btn btn-primary" id="save-vehicle-btn">Add vehicle</button></div>`;
    panel.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click", ()=>closeModal("generic-modal")));
    document.getElementById("save-vehicle-btn").addEventListener("click", ()=>{
      const name = document.getElementById("nv-name").value.trim();
      if(!name){ toast("Give the vehicle a name first.", true); return; }
      VEHICLES.push({ id:"VEH-"+(VEHICLES.length+1), name, plate:document.getElementById("nv-plate").value.trim()||"—", driver:document.getElementById("nv-driver").value.trim()||"Unassigned" });
      closeModal("generic-modal"); toast("Vehicle added to the fleet."); render();
    });
    openModal("generic-modal");
  });
}

/* --- Item summary --- */
const itemSummaryFilter = { segment:"ALL", from:"", to:"" };
function viewAdminItemSummary(){
  const delivered = state.orders.filter(o=>o.deliveredAt &&
    (itemSummaryFilter.segment==="ALL"||o.segment===itemSummaryFilter.segment) &&
    (!itemSummaryFilter.from && !itemSummaryFilter.to ? true : inDateRange(o.deliveredAt, itemSummaryFilter.from, itemSummaryFilter.to)));
  const perItem = {}; const perSegment = {};
  delivered.forEach(o=>o.items.forEach(i=>{
    if(i.avail && i.avail!=="available") return;
    if(!perItem[i.itemId]) perItem[i.itemId] = {name:i.name, segment:i.segment, orders:0, qty:0, sales:0};
    perItem[i.itemId].orders++; perItem[i.itemId].qty += i.qty; perItem[i.itemId].sales += i.rate*i.qty;
    perSegment[i.segment] = (perSegment[i.segment]||0) + i.rate*i.qty;
  }));
  const items = Object.values(perItem).sort((a,b)=>b.sales-a.sales);
  const maxSeg = Math.max(1, ...Object.values(perSegment));
  return `<div class="view-head"><div><h2>Item summary</h2><p>How many orders and how much revenue each item and segment has generated once delivered.</p></div>${exportButtonsHTML("item-summary")}</div>
  <div class="filter-bar">
    <label>Segment <select id="isf-segment">${["ALL",...ALL_SEGMENTS].map(s=>`<option value="${s}" ${itemSummaryFilter.segment===s?'selected':''}>${s}</option>`).join("")}</select></label>
    <label>From <input type="date" id="isf-from" value="${itemSummaryFilter.from}"/></label>
    <label>To <input type="date" id="isf-to" value="${itemSummaryFilter.to}"/></label>
    <button class="btn btn-ghost btn-sm" id="isf-clear">Clear filters</button>
  </div>
  <h3 class="section-title">Trend by segment</h3>
  ${Object.keys(perSegment).length===0? emptyState("No delivered sales yet","Trends will appear once tickets are delivered.") :
    Object.entries(perSegment).sort((a,b)=>b[1]-a[1]).map(([seg,val])=>`
    <div class="trend-bar-row"><div class="tb-label">${seg}</div><div class="trend-bar-track"><div class="trend-bar-fill" style="width:${(val/maxSeg*100).toFixed(0)}%"></div></div><div class="tb-val">${peso(val)}</div></div>
  `).join("")}
  <h3 class="section-title">Item breakdown</h3>
  <div class="table-wrap"><table>
    <thead><tr><th>Item</th><th>Segment</th><th>Orders delivered</th><th>Qty delivered</th><th>Sales</th></tr></thead>
    <tbody>
      ${items.length===0?`<tr><td colspan="5" class="muted">Nothing delivered in this range yet.</td></tr>`:items.map(i=>`<tr><td>${i.name}</td><td>${i.segment}</td><td>${i.orders}</td><td>${i.qty}</td><td>${peso(i.sales)}</td></tr>`).join("")}
    </tbody>
  </table></div>`;
}
function afterRenderAdminItemSummary(){
  document.getElementById("isf-segment").addEventListener("change", e=>{ itemSummaryFilter.segment=e.target.value; render(); });
  document.getElementById("isf-from").addEventListener("change", e=>{ itemSummaryFilter.from=e.target.value; render(); });
  document.getElementById("isf-to").addEventListener("change", e=>{ itemSummaryFilter.to=e.target.value; render(); });
  document.getElementById("isf-clear").addEventListener("click", ()=>{ itemSummaryFilter.segment="ALL"; itemSummaryFilter.from=""; itemSummaryFilter.to=""; render(); });
}

/* --- Items & pricing (with edit + image + stock) --- */
function viewAdminItems(){
  return `<div class="view-head">
    <div><h2>Items &amp; pricing</h2><p>Catalog shown to requesters in the Shop tab.</p></div>
    <div class="export-row">${exportButtonsHTML("items-pricing")}<button class="btn btn-primary btn-sm" id="add-item-btn">+ Add item</button></div>
  </div>
  <div class="table-wrap"><table>
    <thead><tr><th>Image</th><th>Segment</th><th>Item</th><th>Rate</th><th>OUM</th><th>Stock</th><th></th></tr></thead>
    <tbody>
      ${CATALOG.map(it=>`<tr><td><div style="width:36px;height:36px;border-radius:8px;overflow:hidden;">${itemImageHTML(it)}</div></td><td>${it.segment}</td><td>${it.name}</td><td>${peso(it.rate)}</td><td>${it.oum}</td><td>${it.stock}</td>
      <td><button class="btn btn-ghost btn-sm" data-edit-item="${it.id}">Edit</button></td></tr>`).join("")}
    </tbody>
  </table></div>`;
}
function itemFormModal(existing){
  const panel = document.getElementById("generic-modal-panel");
  const it = existing || {segment:ALL_SEGMENTS[0], name:"", rate:"", oum:"pc", stock:20, image:""};
  panel.innerHTML = `
    <div class="modal-head"><h3>${existing?"Edit item":"Add catalog item"}</h3><button class="icon-btn" data-close="generic-modal">✕</button></div>
    <div class="modal-body">
      <div class="form-grid-2">
        <label>Segment <select id="ni-segment">${ALL_SEGMENTS.map(s=>`<option ${it.segment===s?'selected':''}>${s}</option>`).join("")}</select></label>
        <label>Unit of measure <input id="ni-oum" value="${it.oum}" placeholder="pc / sqft / sqm" /></label>
      </div>
      <label>Item name <input id="ni-name" value="${it.name}" placeholder="e.g. Solar Pedestrian Signage" /></label>
      <div class="img-upload">
        <span class="img-upload-title">Item image</span>
        <div class="img-upload-row">
          <div class="img-upload-preview" id="ni-preview">${it.image?`<img src="${it.image}" alt="">`:"No image"}</div>
          <div class="img-upload-actions">
            <input type="file" id="ni-file" accept="image/*" class="hidden" />
            <div>
              <button type="button" class="btn btn-ghost btn-sm" id="ni-pick">Upload image</button>
              <button type="button" class="linklike" id="ni-remove">Remove</button>
            </div>
            <div class="muted" id="ni-status" style="font-size:12px;">${CGS_SHEETS.enabled()?"Uploads to Google Drive; the link is saved in the Sheet.":"Google Sheets isn't connected — paste an image URL below instead."}</div>
          </div>
        </div>
      </div>
      <label>Or paste an image URL <input id="ni-image" value="${it.image||''}" placeholder="https://… (leave blank for the default icon)" /></label>
      <div class="form-grid-2">
        <label>Rate (₱) <input id="ni-rate" type="number" min="0" step="0.01" value="${it.rate}"/></label>
        <label>Stock <input id="ni-stock" type="number" min="0" value="${it.stock}" /></label>
      </div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close="generic-modal">Cancel</button><button class="btn btn-primary" id="save-item-btn">${existing?"Save changes":"Add to catalog"}</button></div>`;
  panel.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click", ()=>closeModal("generic-modal")));
  // --- image upload (admin -> Google Drive -> link stored in the Sheet) ---
  let imgMeta = { imageView: it.imageView||null, imageFileId: it.imageFileId||null };
  let uploading = false;
  const fileEl = document.getElementById("ni-file"), statusEl = document.getElementById("ni-status");
  const urlEl = document.getElementById("ni-image"), previewEl = document.getElementById("ni-preview");
  const showPreview = ()=>{ previewEl.innerHTML = urlEl.value.trim() ? `<img src="${urlEl.value.trim()}" alt="">` : "No image"; };
  document.getElementById("ni-pick").addEventListener("click", ()=>fileEl.click());
  fileEl.addEventListener("change", async ()=>{
    const f = fileEl.files[0]; if(!f) return;
    uploading = true; statusEl.textContent = "Uploading to Google Drive…";
    try{
      const out = await CGS_SHEETS.uploadImage(f);
      urlEl.value = out.url; imgMeta = { imageView: out.viewUrl, imageFileId: out.fileId };
      showPreview(); statusEl.textContent = "Uploaded ✓ — saved to Google Drive.";
    }catch(err){
      statusEl.textContent = "Upload failed: " + err.message; toast("Image upload failed: " + err.message, true);
    }finally{ uploading = false; fileEl.value = ""; }
  });
  document.getElementById("ni-remove").addEventListener("click", ()=>{
    urlEl.value = ""; imgMeta = { imageView:null, imageFileId:null }; showPreview(); statusEl.textContent = "Image removed (save to apply).";
  });
  urlEl.addEventListener("input", ()=>{ imgMeta = { imageView:null, imageFileId:null }; showPreview(); }); // pasted URL replaces uploaded file

  document.getElementById("save-item-btn").addEventListener("click", ()=>{
    if(uploading){ toast("Wait for the image upload to finish.", true); return; }
    const name = document.getElementById("ni-name").value.trim();
    const rate = parseFloat(document.getElementById("ni-rate").value);
    if(!name || !rate){ toast("Add a name and rate first.", true); return; }
    const data = { segment:document.getElementById("ni-segment").value, name, rate,
      oum:document.getElementById("ni-oum").value||"pc", stock:parseInt(document.getElementById("ni-stock").value,10)||0,
      image: document.getElementById("ni-image").value.trim()||null,
      imageView: imgMeta.imageView, imageFileId: imgMeta.imageFileId };
    if(existing){ Object.assign(existing, data); toast("Item updated."); }
    else { CATALOG.push({ id:"ITM-"+String(CATALOG.length+1).padStart(3,"0"), ...data }); toast("Item added to catalog."); }
    closeModal("generic-modal"); render();
  });
  openModal("generic-modal");
}
function afterRenderAdminItems(){
  document.getElementById("add-item-btn").addEventListener("click", ()=>itemFormModal(null));
  document.querySelectorAll("[data-edit-item]").forEach(b=>b.addEventListener("click", ()=>{
    const it = CATALOG.find(i=>i.id===b.dataset.editItem); itemFormModal(it);
  }));
}

/* --- Users & passwords (admin) ---
   Accounts live in the Users tab. A password is never shown or stored there:
   an admin can only issue a temporary one, which the person must replace at
   their next sign-in. */
const usersView = { list:null, error:null };
function viewAdminUsers(){
  const head = `<div class="view-head"><div><h2>Users &amp; passwords</h2><p>Everyone who can sign in. Reset a password to give someone a temporary one — they must choose a new password the next time they sign in.</p></div>${CGS_SHEETS.enabled()?`<button class="btn btn-primary btn-sm" id="staff-add">Add staff account</button> <button class="btn btn-ghost btn-sm" id="users-refresh">Refresh</button>`:""}</div>`;
  if(!CGS_SHEETS.enabled()) return head + emptyState("Connect Google Sheets","Accounts are stored in your Google Sheet. Add your Web App URL in config.js to manage them here.");
  return head + `<div id="users-table">${usersTableHTML()}</div>`;
}
function usersTableHTML(){
  if(usersView.error) return `<div class="remark-box">${escAttr(usersView.error)}</div>`;
  if(!usersView.list) return `<p class="muted">Loading accounts…</p>`;
  const me = String(state.currentUser.email).toLowerCase();
  return `<div class="table-wrap"><table>
    <thead><tr><th>Name</th><th>Position</th><th>Email</th><th>Company / CP</th><th>Role</th><th>Password</th><th></th></tr></thead>
    <tbody>${usersView.list.map(u=>`<tr>
      <td>${escAttr(u.name)}</td><td>${escAttr(u.position||"—")}</td><td>${escAttr(u.email)}</td>
      <td>${u.company?`${escAttr(u.company)}<div class="muted" style="font-size:11.5px;">${escAttr(u.cpNumber||"")}${u.billTo?` · bill: ${escAttr(u.billTo)}`:""}</div>`:`<span class="muted">${escAttr(u.project||"—")}</span>`}</td>
      <td>${String(u.email).toLowerCase()===me ? ROLE_LABEL[u.role] : `<select data-role-for="${escAttr(u.email)}" aria-label="Role for ${escAttr(u.name)}">${["user","admin","approver1","approver2"].map(r=>`<option value="${r}" ${u.role===r?"selected":""}>${ROLE_LABEL[r]}</option>`).join("")}</select>`}</td>
      <td style="font-size:12px;">${escAttr(u.pwStatus||"—")}</td>
      <td>${String(u.email).toLowerCase()===me ? `<span class="muted" style="font-size:12px;">You</span>` : `<button class="btn btn-ghost btn-sm" data-reset-pw="${escAttr(u.email)}" data-name="${escAttr(u.name)}">Reset password</button>`}</td>
    </tr>`).join("")}</tbody></table></div>`;
}
async function loadUsersList(){
  try{ usersView.list = await CGS_SHEETS.listAccounts(); usersView.error = null; }
  catch(err){ usersView.error = err.message; }
  const el = document.getElementById("users-table");
  if(el){ el.innerHTML = usersTableHTML(); bindUsersTable(); }
}
function bindUsersTable(){
  document.querySelectorAll("[data-role-for]").forEach(sel=>sel.addEventListener("change", async ()=>{
    const email = sel.dataset.roleFor, u = usersView.list.find(x=>x.email===email), role = sel.value;
    if(!confirm(`Make ${u.name} a ${ROLE_LABEL[role]}?`)){ sel.value = u.role; return; }
    try{ await CGS_SHEETS.setRole(email, role); u.role = role; toast(`${u.name} is now ${ROLE_LABEL[role]}.`); }
    catch(err){ toast(err.message, true); sel.value = u.role; }
  }));
  const add = document.getElementById("staff-add"); if(add) add.onclick = openStaffModal;
  document.querySelectorAll("[data-reset-pw]").forEach(b=>b.addEventListener("click", ()=>doResetPassword(b.dataset.resetPw, b.dataset.name)));
}
function openStaffModal(){
  showSpModal("Add a staff account", `<p class="muted" style="margin:0 0 8px;">For CGS admins and approvers. They get a temporary password and choose their own at first sign-in.</p>
    <label>Full name <span class="req">*</span><input id="st-name" /></label><label>Position<input id="st-pos" /></label>
    <label>Email <span class="req">*</span><input type="email" id="st-email" /></label>
    <label>Role <select id="st-role"><option value="approver1">Approver 1</option><option value="approver2">Approver 2</option><option value="admin">CGS Admin</option></select></label>`,
    `<button class="btn btn-ghost" data-sp-close>Cancel</button><button class="btn btn-primary" id="st-save">Create account</button>`, { narrow:true });
  document.getElementById("st-save").addEventListener("click", async ()=>{
    const v = id=>document.getElementById(id).value.trim();
    try{
      const r = await CGS_SHEETS.createStaff({ name:v("st-name"), position:v("st-pos"), email:v("st-email"), role:v("st-role") });
      closeSpModal(); showTempPassword(r.user.name, r.user.email, r.tempPassword); loadUsersList();
    }catch(err){ toast(err.message, true); }
  });
}
async function doResetPassword(email, name){
  if(!confirm(`Reset the password for ${name} (${email})?\n\nThey will be signed out everywhere and given a temporary password to replace at their next sign-in.`)) return;
  try{
    const r = await CGS_SHEETS.resetPassword(email);
    showTempPassword(name, r.email, r.tempPassword);
    loadUsersList();
  }catch(err){ toast(err.message, true); }
}
function showTempPassword(name, email, temp){
  const panel = document.getElementById("generic-modal-panel");
  panel.innerHTML = `
    <div class="modal-head"><h3>Temporary password</h3><button class="icon-btn" data-close="generic-modal">✕</button></div>
    <div class="modal-body">
      <p>Give this to <strong>${escAttr(name)}</strong> (${escAttr(email)}) privately — it is shown only now.</p>
      <div class="temp-pw"><code id="tp-code">${escAttr(temp)}</code><button class="btn btn-ghost btn-sm" id="tp-copy">Copy</button></div>
      <p class="muted" style="font-size:12.5px;">They'll be asked to choose a new password when they sign in with it. Any device they were signed in on has been signed out.</p>
    </div>
    <div class="modal-foot"><button class="btn btn-primary" data-close="generic-modal">Done</button></div>`;
  panel.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click", ()=>closeModal("generic-modal")));
  document.getElementById("tp-copy").addEventListener("click", async ()=>{
    try{ await navigator.clipboard.writeText(temp); toast("Temporary password copied."); }
    catch(e){ const r = document.createRange(); r.selectNodeContents(document.getElementById("tp-code")); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); toast("Select and copy the password."); }
  });
  openModal("generic-modal");
}
function afterRenderAdminUsers(){
  if(!CGS_SHEETS.enabled()) return;
  const r = document.getElementById("users-refresh"); if(r) r.addEventListener("click", ()=>{ usersView.list = null; document.getElementById("users-table").innerHTML = usersTableHTML(); loadUsersList(); });
  bindUsersTable();
  loadUsersList();
}

/* --- Township addresses (feeds the DR) --- */
function viewAdminTownships(){
  const inp = "width:100%;padding:8px 10px;border:1.5px solid var(--sand);border-radius:8px;font-family:inherit;";
  return `<div class="view-head"><div><h2>Township addresses</h2><p>Printed on every DR. Changes save to the Townships tab of your Sheet automatically.</p></div></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Township</th><th>Name on DR</th><th>Address</th></tr></thead>
    <tbody>${state.townshipsList.map((n,i)=>{ const d = state.townshipInfo[n] || {};
      return `<tr><td>${n}</td>
        <td><input style="${inp}" data-tn-legal="${i}" value="${escAttr(d.legalName||n)}" /></td>
        <td><input style="${inp}" data-tn-addr="${i}" value="${escAttr(d.address||"")}" placeholder="Add address" /></td></tr>`; }).join("")}
    </tbody></table></div>`;
}
function afterRenderAdminTownships(){
  const save = (i, field, val)=>{
    const n = state.townshipsList[i];
    state.townshipInfo[n] = { ...(state.townshipInfo[n]||{}), [field]: val.trim() };
    CGS_SHEETS.scheduleSave(snapshotState); toast("Saved.");
  };
  document.querySelectorAll("[data-tn-legal]").forEach(el=>el.addEventListener("change", ()=>save(+el.dataset.tnLegal, "legalName", el.value)));
  document.querySelectorAll("[data-tn-addr]").forEach(el=>el.addEventListener("change", ()=>save(+el.dataset.tnAddr, "address", el.value)));
}

/* --- Availability watch (production ETAs + availability history) --- */
function viewAdminAvailability(){
  const pending = [];
  state.orders.forEach(o=>o.items.forEach((i,idx)=>{
    if(i.avail==="production" && !i.released && !isVoidOrder(o)) pending.push({o,i,idx});
  }));
  pending.sort((a,b)=> (a.i.etaDate||"9999").localeCompare(b.i.etaDate||"9999"));
  const today = new Date(); today.setHours(0,0,0,0);
  const history = state.availabilityLog.slice().sort((a,b)=>b.ts-a.ts);
  return `<div class="view-head"><div><h2>Availability watch</h2><p>Items currently in production, their availability date, and the history of what's come available or been marked unavailable.</p></div></div>
  <h3 class="section-title">Waiting on production</h3>
  ${pending.length===0 ? emptyState("Nothing in production","Items marked \u201cIn production\u201d during review will show up here with their ETA.") : `
  <div class="table-wrap"><table>
    <thead><tr><th>Ticket</th><th>Item</th><th>Qty</th><th>Township</th><th>Available on</th><th></th></tr></thead>
    <tbody>
      ${pending.map(({o,i,idx})=>{
        const eta = new Date(i.etaDate+"T00:00:00");
        const daysLeft = Math.round((eta.getTime()-today.getTime())/86400000);
        const dueLabel = daysLeft<=0 ? `<span class="unavail">Due now</span>` : `${daysLeft} day${daysLeft===1?"":"s"} left`;
        return `<tr><td>${o.id}</td><td>${i.name} <span class="muted">× ${i.qty} ${i.oum}</span></td><td>${i.qty}</td><td>${o.township}</td>
          <td><input type="date" class="eta-input" data-watch-eta="${o.id}|${idx}" value="${i.etaDate}"/> <span class="muted" style="font-size:11.5px;">${dueLabel}</span></td>
          <td><button class="btn btn-ghost btn-sm" data-watch-release="${o.id}|${idx}">Release now</button></td></tr>`;
      }).join("")}
    </tbody>
  </table></div>`}
  <h3 class="section-title">Availability history</h3>
  ${history.length===0 ? emptyState("No history yet","Items that become available or get marked unavailable will be logged here.") : `
  <div class="table-wrap"><table>
    <thead><tr><th>When</th><th>Ticket</th><th>Item</th><th>Qty</th><th>Township</th><th>Result</th><th>Goes to</th></tr></thead>
    <tbody>
      ${history.map(h=>`<tr><td>${fmtDate(h.ts)}</td><td>${h.orderId}</td><td>${h.itemName}</td><td>${h.qty}</td><td>${h.township}</td>
        <td><span class="status-badge ${h.result==='available'?'status-delivered':'status-rejected'}">${h.result==='available'?'Available':'Not available'}</span></td>
        <td>${h.merged ? "Same ticket &amp; DR" : (h.newTicketId||"—")}</td></tr>`).join("")}
    </tbody>
  </table></div>`}`;
}
function afterRenderAdminAvailability(){
  document.querySelectorAll("[data-watch-eta]").forEach(inp=>{
    inp.addEventListener("change", ()=>{
      const [orderId, idx] = inp.dataset.watchEta.split("|");
      const o = state.orders.find(o=>o.id===orderId);
      o.items[+idx].etaDate = inp.value || null;
      toast("Availability date updated."); render();
    });
  });
  document.querySelectorAll("[data-watch-release]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const [orderId, idx] = btn.dataset.watchRelease.split("|");
      const o = state.orders.find(o=>o.id===orderId);
      releaseItem(o, o.items[+idx]);
      toast(`Released — a new ticket was created and ${o.userName} will be notified.`);
      render();
    });
  });
}

/* ---------------------------- VIEW REGISTRY --------------------------------*/
const VIEWS = {
  "u-dashboard": viewUserDashboard, "u-shop": viewUserShop, "u-ack": viewUserAck, "u-confirm": viewUserConfirm,
  "a-overview": viewAdminOverview, "a-new": viewAdminNew, "a-confirm": viewAdminConfirm,
  "a-prep": viewAdminPrep, "a-btt": viewAdminBTT, "a-dr": viewAdminDR,
  "a-delivery": viewAdminDelivery, "a-delivered": viewAdminDelivered, "a-history": viewAdminHistory,
  "a-edit": viewAdminEdit, "a-vehicles": viewAdminVehicles, "a-item-summary": viewAdminItemSummary,
  "a-items": viewAdminItems, "a-availability": viewAdminAvailability, "a-townships": viewAdminTownships, "a-users": viewAdminUsers,
  "a-companies": viewAdminCompanies, "a-sp-pricing": viewAdminSpPricing, "a-sp-proposals": viewAdminSpProposals,
  "a-billing": viewAdminBilling, "u-billing": viewUserBilling,
  "u-proposals": viewUserProposals, "p-queue": viewApproverQueue, "p-history": viewApproverHistory
};
function afterRender(view){
  if(view==="u-shop") afterRenderShop();
  if(view==="u-dashboard" || view==="u-ack" || view==="u-confirm") afterRenderUser();
  if(view==="u-dashboard" || view==="u-proposals") afterRenderSpClient();
  if(view==="a-companies") afterRenderAdminCompanies();
  if(view==="a-billing") afterRenderAdminBilling();
  if(view==="u-billing") afterRenderBilling();
  document.querySelectorAll("[data-go-billing]").forEach(b=>b.addEventListener("click", ()=>navigate("u-billing")));
  if(view==="a-sp-pricing") afterRenderAdminSpPricing();
  if(view==="a-sp-proposals") afterRenderAdminSpProposals();
  if(view==="p-queue" || view==="p-history") afterRenderApprover();
  if(view==="a-overview") afterRenderAdminOverview();
  if(view==="a-new") afterRenderAdminNew();
  if(view==="a-prep") afterRenderAdminPrep();
  if(view==="a-btt") afterRenderAdminBTT();
  if(view==="a-dr") afterRenderAdminDR();
  if(view==="a-delivery") afterRenderAdminDelivery();
  if(view==="a-history") afterRenderAdminHistory();
  if(view==="a-edit") afterRenderAdminEdit();
  if(view==="a-vehicles") afterRenderAdminVehicles();
  if(view==="a-item-summary") afterRenderAdminItemSummary();
  if(view==="a-items") afterRenderAdminItems();
  if(view==="a-townships") afterRenderAdminTownships();
  if(view==="a-users") afterRenderAdminUsers();
  if(view==="a-availability") afterRenderAdminAvailability();
  maybeShowAvailabilityNotice();
}

/* ============================================================
   SPECIAL PROJECTS — clients outside Megaworld
   Company registers (BIR 2303) -> admin approves -> staff order WITHOUT prices ->
   admin prices it -> cost proposal -> Approver 1 -> Approver 2 -> client signs ->
   the usual scheduling / BTT / DR / delivery steps -> ticket closed.
   ============================================================ */
const SP_STAGES = ["Submitted","Pricing","Approver 1","Approver 2","Signed copy","Preparation","Scheduling & DR","Out for delivery","Delivered"];
const SP_STAGE_INDEX = { sp_pricing:1, sp_revision:1, sp_approver1:2, sp_approver2:3, sp_client:4, preparation:5, ready_for_btt:6, ready_for_dr:6, for_delivery:7, delivered:8 };
const SP_PRICING_STATUSES = ["sp_pricing","sp_revision"];
const SP_PAY_MODES = ["Bank transfer","Check"];
const VAT_RATE = 0.12;
const round2 = n => Math.round((Number(n)||0)*100)/100;
const esc = v => escAttr(v);
function isSPOrder(o){ return !!o && o.flow==="sp"; }
function isSPUser(u){ u = u || state.currentUser; return !!u && u.role==="user" && u.project==="special"; }
function isApprover(u){ u = u || state.currentUser; return !!u && (u.role==="approver1" || u.role==="approver2"); }
function cpNumberFor(o){ return "CP-" + String(o.id).replace(/^TCK-/,""); }
function clientSeesProposal(o){ return !!(o.proposal && o.proposal.sentAt); }
function isStaffView(){ return !!state.currentUser && state.currentUser.role!=="user"; }
function spItemNotesHTML(i){
  return (i.customization ? `<div class="sp-note">Customization: ${esc(i.customization)}</div>` : "") + (i.note ? `<div class="sp-note">Special request: ${esc(i.note)}</div>` : "");
}
function spItemRowsHTML(o){
  const showPrice = isStaffView() ? true : clientSeesProposal(o);
  return o.items.map(i=>`<div class="ticket-item-row"><span>${esc(i.name)} × ${esc(i.qty)} ${esc(i.oum)}${spItemNotesHTML(i)}</span><span>${showPrice && i.rate ? peso(i.rate*i.qty) : ""}</span></div>`).join("");
}
function spMoneyLabel(o){
  if(!o.proposal) return isStaffView() ? "Not priced yet" : "Pricing in progress";
  if(!isStaffView() && !clientSeesProposal(o)) return "Pricing in progress";
  return `Total ${peso(o.proposal.totals.total)} (incl. 12% VAT)`;
}
function showSpModal(title, body, foot, opts){
  const panel = document.getElementById("sp-modal-panel");
  panel.className = "modal-panel" + ((opts && opts.narrow) ? "" : " modal-wide");
  panel.innerHTML = `<div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-sp-close aria-label="Close">✕</button></div><div class="modal-body">${body}</div>${foot?`<div class="modal-foot">${foot}</div>`:""}`;
  panel.querySelectorAll("[data-sp-close]").forEach(b=>b.addEventListener("click", closeSpModal));
  openModal("sp-modal");
  return panel;
}
let spBlobUrl = null;
function closeSpModal(){
  closeModal("sp-modal");
  const f = document.getElementById("sp-modal-panel").querySelector("iframe"); if(f) f.src = "about:blank";
  if(spBlobUrl){ URL.revokeObjectURL(spBlobUrl); spBlobUrl = null; }
}
document.querySelector('[data-close="sp-modal"]').addEventListener("click", closeSpModal);
function base64ToBlobUrl(b64, mime){
  const bin = atob(b64), bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  if(spBlobUrl) URL.revokeObjectURL(spBlobUrl);
  spBlobUrl = URL.createObjectURL(new Blob([bytes], { type:mime }));
  return spBlobUrl;
}
function reportNotify(r, who){
  if(!r){ toast("Saved, but the e-mail notification couldn't be sent.", true); return; }
  if(r.duplicate) return;
  if(r.recipients===0) toast(`Saved — but no ${who} account exists yet to notify. Add one under Users & passwords.`, true);
  else if(!r.sent) toast(`Saved — but the e-mail to ${who} couldn't be sent.`, true);
}
function saveThenNotify(o, kind, who){
  return CGS_SHEETS.saveNow(snapshotState).then(()=>CGS_SHEETS.notify(o.id, kind)).then(r=>reportNotify(r, who)).catch(()=>{});
}

/* ---------- the cost proposal document (what approvers and clients read, and what gets printed) ---------- */
function spTotals(lines, mode, val, withDF, df){
  const subtotal = round2(lines.reduce((s,l)=>s + (Number(l.qty)||0)*(Number(l.price)||0), 0));
  let discount = mode==="percent" ? subtotal*(Number(val)||0)/100 : mode==="amount" ? (Number(val)||0) : 0;
  discount = Math.min(round2(discount), subtotal);
  const dfAmount = withDF ? round2(df) : 0;
  const base = round2(subtotal - discount + dfAmount);
  const vat = round2(base*VAT_RATE);
  return { subtotal, discount, dfAmount, base, vat, total: round2(base+vat) };
}
function proposalDocHTML(o){
  const p = o.proposal, t = p.totals, to = o.proposalTo || {};
  const rows = o.items.map((i,n)=>`<tr><td>${n+1}</td><td><strong>${esc(i.name)}</strong>${spItemNotesHTML(i)}</td><td class="num">${esc(i.qty)}</td><td>${esc(i.oum)}</td><td class="num">${peso(i.rate)}</td><td class="num">${peso(i.rate*i.qty)}</td></tr>`).join("");
  const sig = (a,label)=>`<div class="pd-sig"><div class="pd-sig-line">${a && a.status==="approved" ? `<strong>${esc(a.by)}</strong><span>${fmtDateShort(a.at)}</span>` : "&nbsp;"}</div><div class="pd-sig-label">${label}</div></div>`;
  return `<div class="proposal-doc">
    <div class="pd-head"><div><div class="pd-brand">Central Group Services</div><div class="pd-sub">CGS Central</div></div><div class="pd-title">COST PROPOSAL</div></div>
    <div class="pd-meta">
      <div><span>Proposal no.</span>${esc(p.no)}${p.rev?` · Rev ${p.rev}`:""}</div>
      <div><span>Date</span>${fmtDateShort(p.sentAt || p.preparedAt)}</div>
      <div><span>Payment mode</span>${esc(o.payMode||"—")}</div>
      <div><span>Bill to</span>${esc(o.billTo||"—")}</div>
    </div>
    <div class="pd-to"><span>To</span><strong>${esc(to.name)}</strong>${to.position?`, ${esc(to.position)}`:""}<br>${esc(o.company||"")}<br>${esc(to.address||"")}</div>
    <p class="pd-intro">We are pleased to submit our cost proposal for the following:</p>
    <table class="pd-table"><thead><tr><th>#</th><th>Item / details</th><th class="num">Qty</th><th>Unit</th><th class="num">Unit price</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <table class="pd-totals"><tbody>
      <tr><td>Subtotal</td><td class="num">${peso(t.subtotal)}</td></tr>
      ${t.discount>0 ? `<tr><td>Less: discount${p.discountMode==="percent"?` (${esc(p.discountValue)}%)`:""}</td><td class="num">− ${peso(t.discount)}</td></tr>` : ""}
      ${p.withDF ? `<tr><td>Delivery fee</td><td class="num">${peso(t.dfAmount)}</td></tr>` : ""}
      <tr><td>Vatable amount</td><td class="num">${peso(t.base)}</td></tr>
      <tr><td>VAT (12%)</td><td class="num">${peso(t.vat)}</td></tr>
      <tr class="grand"><td>TOTAL AMOUNT DUE</td><td class="num">${peso(t.total)}</td></tr>
    </tbody></table>
    ${p.withDF ? "" : `<p class="pd-note"><strong>Pricing includes delivery fee.</strong></p>`}
    ${p.notes ? `<p class="pd-note">${esc(p.notes).replace(/\n/g,"<br>")}</p>` : ""}
    <div class="pd-sigs">${sig({status:"approved",by:p.preparedBy,at:p.preparedAt},"Prepared by")}${sig(p.a1,"Approved by — Approver 1")}${sig(p.a2,"Approved by — Approver 2")}</div>
    <div class="pd-conforme"><div class="pd-sig-line">&nbsp;</div><div class="pd-sig-label">Conforme — signature over printed name &amp; date</div></div>
  </div>`;
}
function printProposal(o){
  const root = document.getElementById("print-root");
  root.innerHTML = proposalDocHTML(o);
  document.body.classList.add("printing-proposal");
  const done = ()=>{ document.body.classList.remove("printing-proposal"); root.innerHTML = ""; window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  window.print();
}
function openProposalViewer(o, extraFoot){
  const panel = showSpModal(`Cost proposal ${esc(o.proposal.no)}`, proposalDocHTML(o),
    `${extraFoot||""}<button class="btn btn-ghost" id="pv-print">Print / Save as PDF</button><button class="btn btn-primary" data-sp-close>Close</button>`);
  document.getElementById("pv-print").addEventListener("click", ()=>printProposal(o));
  return panel;
}
function openPdfViewer(title, blobUrl, extraBody, extraFoot){
  return showSpModal(title,
    `<iframe class="pdf-frame" src="${blobUrl}" title="${esc(title)}"></iframe><p class="muted" style="font-size:12px;margin:6px 0 0;"><a href="${blobUrl}" target="_blank" rel="noopener">Open in a new tab</a> if the preview doesn't show on your device.</p>${extraBody||""}`,
    `${extraFoot||""}<button class="btn btn-ghost" data-sp-close>Close</button>`);
}

/* ---------- requester: cart, submit, dashboard ---------- */
function companyBanner(){
  const u = state.currentUser;
  if(u.companyStatus==="pending") return `<div class="remark-box"><strong>${esc(u.company)}</strong> is waiting for admin approval. You can place orders now — CGS starts pricing them once your company is approved.</div>`;
  if(u.companyStatus==="rejected") return `<div class="remark-box"><strong>${esc(u.company)}</strong> was not approved. Please contact CGS.</div>`;
  return "";
}
function openSpAddModal(itemId, lineId, fromCart){
  const it = CATALOG.find(i=>i.id===itemId); if(!it) return;
  const line = lineId ? state.spCart.find(l=>l.lineId===lineId) : null;
  showSpModal(esc(it.name),
    `<p class="muted" style="margin:0 0 10px;font-size:13px;">${esc(it.segment)} · per ${esc(it.oum)} · CGS will quote the price.</p>
     <label>Quantity <span class="req">*</span><input type="number" id="spa-qty" min="1" step="1" value="${line?line.qty:1}" /></label>
     <label>Customization <input type="text" id="spa-custom" maxlength="120" placeholder="e.g. single side / double side, size, color" value="${esc(line?line.customization:"")}" /></label>
     <label>Special request <textarea id="spa-note" rows="3" maxlength="400" placeholder="Anything else we should know about this item?">${esc(line?line.note:"")}</textarea></label>`,
    `<button class="btn btn-ghost" data-sp-close>Cancel</button><button class="btn btn-primary" id="spa-save">${line?"Save changes":"Add to cart"}</button>`, { narrow:true });
  document.getElementById("spa-save").addEventListener("click", ()=>{
    const qty = parseInt(document.getElementById("spa-qty").value, 10);
    if(!(qty>=1 && qty<=100000)){ toast("Enter a quantity of 1 or more.", true); return; }
    const data = { qty, customization: document.getElementById("spa-custom").value.trim(), note: document.getElementById("spa-note").value.trim() };
    if(line) Object.assign(line, data);
    else state.spCart.push({ lineId:"L"+Date.now().toString(36)+Math.random().toString(36).slice(2,6), itemId, ...data });
    closeSpModal(); updateCartBadge(); toast(line ? "Cart updated." : "Added to cart.");
    if(fromCart){ renderCart(); cartDrawer.classList.add("open"); }
    renderIfShop();
  });
}
function renderSpCart(){
  const wrap = document.getElementById("cart-items");
  const lines = state.spCart;
  if(lines.length===0){
    wrap.innerHTML = `<div class="empty-state"><h4>Your cart is empty</h4><p>Head to the Shop tab and add what you need.</p></div>`;
  } else {
    wrap.innerHTML = lines.map(l=>{ const it = CATALOG.find(i=>i.id===l.itemId) || { name:"(removed item)", oum:"" };
      return `<div class="cart-line">
        <div class="cart-line-thumb">${it.id?itemImageHTML(it):""}</div>
        <div class="cart-line-info">
          <div class="cart-line-name">${esc(it.name)}</div>
          <div class="cart-line-price">${esc(l.qty)} ${esc(it.oum)}</div>
          ${spItemNotesHTML(l)}
          <div class="cart-line-actions"><button class="btn btn-ghost btn-sm" data-sp-edit="${l.lineId}">Edit</button><button class="cart-line-remove" data-sp-remove="${l.lineId}">Remove</button></div>
        </div></div>`; }).join("") +
      `<label class="sp-paymode">Payment mode <span class="req">*</span>
         <select id="sp-paymode"><option value="">Select…</option>${SP_PAY_MODES.map(m=>`<option ${state.spPayMode===m?"selected":""}>${m}</option>`).join("")}</select></label>
       <p class="muted" style="font-size:12px;">No prices yet — CGS will send a cost proposal for your approval.</p>`;
  }
  document.getElementById("checkout-btn").disabled = lines.length===0;
  wrap.querySelectorAll("[data-sp-edit]").forEach(b=>b.addEventListener("click", ()=>{ const l = state.spCart.find(x=>x.lineId===b.dataset.spEdit); cartDrawer.classList.remove("open"); openSpAddModal(l.itemId, l.lineId, true); }));
  wrap.querySelectorAll("[data-sp-remove]").forEach(b=>b.addEventListener("click", ()=>{ state.spCart = state.spCart.filter(x=>x.lineId!==b.dataset.spRemove); updateCartBadge(); renderCart(); renderIfShop(); }));
  const pm = document.getElementById("sp-paymode"); if(pm) pm.addEventListener("change", ()=>{ state.spPayMode = pm.value; });
}
function spContacts(){
  const u = state.currentUser, out = [], seen = new Set();
  const add = (c, tag)=>{
    const k = [c.name,c.position,c.address].map(x=>String(x||"").toLowerCase().replace(/\s+/g," ").trim()).join("|");
    if(!c.name || !c.address || seen.has(k)) return; seen.add(k); out.push({ name:c.name, position:c.position||"", address:c.address, tag });
  };
  add({ name:u.name, position:u.position, address:u.companyAddress }, "Registered contact");
  myOrders().filter(o=>isSPOrder(o) && o.proposalTo).forEach(o=>add(o.proposalTo, "Used before"));
  return out;
}
function openSpSubmit(){
  const u = state.currentUser;
  if(state.spCart.length===0) return;
  if(!state.spPayMode){ toast("Choose a payment mode — bank transfer or check — before submitting.", true); return; }
  if(u.companyStatus==="rejected"){ toast("Your company wasn't approved, so orders can't be submitted. Please contact CGS.", true); return; }
  cartDrawer.classList.remove("open");
  const contacts = spContacts();
  const summary = state.spCart.map(l=>{ const it = CATALOG.find(i=>i.id===l.itemId) || {name:"(removed item)",oum:""};
    return `<div class="co-summary-row"><span>${esc(it.name)} × ${esc(l.qty)} ${esc(it.oum)}${spItemNotesHTML(l)}</span></div>`; }).join("");
  showSpModal("Submit your order",
    `<div class="co-summary">${summary}<div class="co-summary-row" style="border-top:1px solid var(--sand);margin-top:6px;padding-top:8px;"><span>Payment mode</span><strong>${esc(state.spPayMode)}</strong></div></div>
     <label>Bill the order to <span class="req">*</span><input id="sps-billto" value="${esc(u.billTo||"")}" placeholder="Name or department to bill" /></label>
     <p class="field-note" style="margin-top:-6px;">From your account — change it here if this order should be billed to someone else.</p>
     <div class="sp-to"><div class="ordered-by-title">Address the cost proposal to</div>
       ${contacts.map((c,n)=>`<label class="sp-contact"><input type="radio" name="spc" value="${n}" ${n===0?"checked":""}/><span><strong>${esc(c.name)}</strong>${c.position?`, ${esc(c.position)}`:""}<br><span class="muted">${esc(c.address)}</span> <em class="sp-tag">${c.tag}</em></span></label>`).join("")}
       <label class="sp-contact"><input type="radio" name="spc" value="new" ${contacts.length===0?"checked":""}/><span><strong>Add another person</strong></span></label>
       <div id="sps-new" class="sp-new ${contacts.length===0?"":"hidden"}">
         <label>Name <span class="req">*</span><input id="sps-name" /></label>
         <label>Position <input id="sps-pos" /></label>
         <label>Address <span class="req">*</span><textarea id="sps-addr" rows="2"></textarea></label>
       </div></div>`,
    `<button class="btn btn-ghost" data-sp-close>Back</button><button class="btn btn-primary" id="sps-submit">Submit</button>`, { narrow:true });
  document.querySelectorAll('input[name="spc"]').forEach(r=>r.addEventListener("change", ()=>{ document.getElementById("sps-new").classList.toggle("hidden", r.value!=="new" || !r.checked); }));
  document.getElementById("sps-submit").addEventListener("click", async ()=>{
    const billTo = document.getElementById("sps-billto").value.trim();
    if(billTo.length < 2){ toast("Enter who the order should be billed to.", true); return; }
    const pick = document.querySelector('input[name="spc"]:checked').value;
    let to;
    if(pick==="new"){
      to = { name:document.getElementById("sps-name").value.trim(), position:document.getElementById("sps-pos").value.trim(), address:document.getElementById("sps-addr").value.trim() };
      if(!to.name || !to.address){ toast("Enter the name and address the proposal should be addressed to.", true); return; }
    } else { const c = contacts[Number(pick)]; to = { name:c.name, position:c.position, address:c.address }; }
    const sbtn = document.getElementById("sps-submit"); sbtn.disabled = true;
    try{ await reserveTicketNumbers(1); }
    catch(err){ sbtn.disabled = false; toast("Couldn't reach CGS to number your ticket, so nothing was submitted. Please try again in a moment.", true); return; }
    const o = createSpOrder({ billTo, to });
    closeSpModal();
    toast(`Submitted as ${o.id}. CGS will price your order and send you a cost proposal.`);
    navigate("u-dashboard");
  });
}
function createSpOrder({ billTo, to }){
  const u = state.currentUser;
  const items = state.spCart.map(l=>{ const it = CATALOG.find(i=>i.id===l.itemId);
    return { itemId:it.id, name:it.name, segment:it.segment, oum:it.oum, qty:l.qty, rate:null, avail:"available", customization:l.customization, note:l.note }; });
  const o = makeOrder(u, items, u.company || "Special Projects", "Special Projects", "BATCH-"+Date.now());
  Object.assign(o, { flow:"sp", deliveryType:"SP", status:"sp_pricing", company:u.company, companyId:u.companyId, cpNumber:u.cpNumber,
    payMode:state.spPayMode, billTo, proposalTo:to, deliveryAddress:to.address, proposal:null, adminRemark:"" });
  state.orders.push(o);
  state.spCart = []; state.spPayMode = ""; updateCartBadge();
  return o;
}
function viewSpDashboard(){
  const u = state.currentUser, orders = myOrders();
  const ongoing = orders.filter(o=>!["delivered","rejected","cancelled"].includes(o.status)).length;
  const toSign = orders.filter(o=>o.status==="sp_client").length;
  const delivered = orders.filter(o=>o.status==="delivered").length;
  const needsConfirm = orders.filter(o=>!o.customerConfirmedAt && (o.status==="for_delivery"||o.status==="delivered")).length;
  return `<div class="view-head"><div><h2>Welcome back, ${esc(u.name.split(" ")[0])}</h2><p>${esc(u.company||"")} — track your orders from request to delivery.</p></div></div>
  ${companyBanner()}
  <div class="kpi-row">
    <div class="kpi-card"><div class="kpi-label">Ongoing tickets</div><div class="kpi-value">${ongoing}</div></div>
    <div class="kpi-card ${toSign?'warn':''}"><div class="kpi-label">Cost proposals to sign</div><div class="kpi-value">${toSign}</div></div>
    <div class="kpi-card"><div class="kpi-label">Delivered</div><div class="kpi-value">${delivered}</div></div>
    <div class="kpi-card ${needsConfirm?'warn':''}"><div class="kpi-label">Needs delivery confirmation</div><div class="kpi-value">${needsConfirm}</div></div>
  </div>
  <h3 class="section-title">Your orders</h3>
  ${orders.length===0 ? emptyState("No orders yet","Visit the Shop tab to start an order.") : orders.map(o=>orderCardUser(o)).join("")}`;
}
function spOrderCardUser(o){
  const cancellable = ["sp_pricing","sp_revision","sp_approver1","sp_approver2","sp_client"].includes(o.status);
  return `<div class="ticket-card">
    <div class="ticket-top"><div>
      <div class="ticket-id">${o.id} · Special Projects ${ticketMetaBadges(o)} · ${fmtDate(o.createdAt)}</div>
      <div class="ticket-title">${esc(o.company||o.township)}</div>
      <div class="ticket-meta">${o.items.length} item type(s) · ${spMoneyLabel(o)} · ${esc(o.payMode||"")}${o.drNumber?` · DR ${o.drNumber}`:""}${o.bttNumber?` · BTT ${o.bttNumber}`:""}</div>
    </div><span class="status-badge ${STATUS_CLASS[o.status]}">${STATUS_LABEL[o.status]}</span></div>
    ${stageTracker(o)}
    <div class="ticket-items">${spItemRowsHTML(o)}</div>
    ${timelineHTML(o)}
    ${billingChipHTML(o)}
    ${o.status==="sp_revision" && o.revisionFrom==="client" ? `<div class="remark-box"><strong>Your revision request:</strong> ${esc(o.clientRemark||"")}</div>` : (o.adminRemark && o.status!=="sp_revision" ? `<div class="remark-box"><strong>CGS note:</strong> ${esc(o.adminRemark)}</div>` : "")}
    <div class="ticket-actions">
      ${o.status==="sp_client" ? `<button class="btn btn-primary btn-sm" data-sp-go-proposals>Review &amp; sign cost proposal</button>` : ""}
      ${!o.customerConfirmedAt && (o.status==="for_delivery"||o.status==="delivered") ? `<button class="btn btn-primary btn-sm" data-confirm-delivery="${o.id}">Confirm delivery received</button>` : ""}
      ${cancellable ? `<button class="btn btn-ghost btn-sm" data-cancel-order="${o.id}">Cancel order</button>` : ""}
    </div>
  </div>`;
}

/* ---------- requester: cost proposals page ---------- */
function viewUserProposals(){
  const mine = myOrders().filter(o=>isSPOrder(o));
  const waiting = mine.filter(o=>o.status==="sp_client");
  const others = mine.filter(o=>o.status!=="sp_client" && o.proposal && clientSeesProposal(o));
  const card = o=>`<div class="ticket-card">
    <div class="ticket-top"><div>
      <div class="ticket-id">${esc(o.proposal.no)}${o.proposal.rev?` · Rev ${o.proposal.rev}`:""} · ${o.id}</div>
      <div class="ticket-title">Total ${peso(o.proposal.totals.total)} <span class="muted" style="font-size:13px;">incl. 12% VAT</span></div>
      <div class="ticket-meta">${o.items.length} item type(s) · ${esc(o.payMode||"")} · addressed to ${esc((o.proposalTo||{}).name||"")}</div>
    </div><span class="status-badge ${STATUS_CLASS[o.status]}">${STATUS_LABEL[o.status]}</span></div>
    <div class="ticket-actions">
      <button class="btn btn-ghost btn-sm" data-sp-view="${o.id}">View / print</button>
      ${o.status==="sp_client" ? `<label class="btn btn-primary btn-sm file-btn">Attach signed copy<input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" data-sp-sign="${o.id}" /></label>
        <button class="btn btn-ghost btn-sm" data-sp-revise="${o.id}">Request a change</button>` : ""}
      ${o.signedCp ? `<span class="muted" style="font-size:12.5px;">Signed copy sent ${fmtDateShort(o.signedCp.at)}</span>` : ""}
    </div></div>`;
  return `<div class="view-head"><div><h2>Cost proposals</h2><p>Review the proposal, sign it, and attach the signed copy so CGS can schedule your delivery.</p></div></div>
  ${companyBanner()}
  <h3 class="section-title">Waiting for your signed copy</h3>
  ${waiting.length ? waiting.map(card).join("") : emptyState("Nothing to sign right now","When CGS sends a cost proposal for your order, it appears here.")}
  ${others.length ? `<h3 class="section-title">Earlier proposals</h3>${others.map(card).join("")}` : ""}`;
}
function afterRenderSpClient(){
  document.querySelectorAll("[data-sp-go-proposals]").forEach(b=>b.addEventListener("click", ()=>navigate("u-proposals")));
  document.querySelectorAll("[data-sp-view]").forEach(b=>b.addEventListener("click", ()=>{ const o = state.orders.find(x=>x.id===b.dataset.spView); if(o) openProposalViewer(o); }));
  document.querySelectorAll("[data-sp-sign]").forEach(inp=>inp.addEventListener("change", ()=>{ const f = inp.files[0]; if(f) submitSignedCp(inp.dataset.spSign, f); inp.value = ""; }));
  document.querySelectorAll("[data-sp-revise]").forEach(b=>b.addEventListener("click", ()=>openReviseModal(b.dataset.spRevise)));
}
async function submitSignedCp(orderId, file){
  const o = state.orders.find(x=>x.id===orderId); if(!o || o.status!=="sp_client") return;
  const okType = /^(application\/pdf|image\/jpeg|image\/png)$/.test(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
  if(!okType){ toast("Attach the signed copy as a PDF, JPG or PNG.", true); return; }
  if(file.size > 8*1024*1024){ toast("That file is over 8 MB. Please attach a smaller scan.", true); return; }
  toast("Uploading your signed copy…");
  try{
    const data = await CGS_SHEETS.fileToBase64(file);
    const r = await CGS_SHEETS.uploadSignedCp(orderId, file.name, data);
    const now = Date.now();
    o.signedCp = { fileId:r.fileId, name:r.name, type:r.type, at:now };
    o.status = "preparation"; o.prepStatus = "ongoing"; o.confirmedAt = o.confirmedAt||now; o.ackAt = now;
    o.adminRemark = "Signed cost proposal received — now being prepared.";
    toast("Signed copy received — CGS will prepare and schedule your delivery.");
    render();
    saveThenNotify(o, "signed_received", "CGS");
  }catch(err){ toast("Couldn't upload the signed copy: " + err.message, true); }
}
function openReviseModal(orderId){
  const o = state.orders.find(x=>x.id===orderId); if(!o) return;
  showSpModal("Request a change", `<p style="margin:0 0 8px;">Tell CGS what should change in <strong>${esc(o.proposal.no)}</strong>. They'll send a revised proposal through approval again.</p><label>What should change? <span class="req">*</span><textarea id="rv-remark" rows="4"></textarea></label>`,
    `<button class="btn btn-ghost" data-sp-close>Cancel</button><button class="btn btn-primary" id="rv-send">Send to CGS</button>`, { narrow:true });
  document.getElementById("rv-send").addEventListener("click", ()=>{
    const remark = document.getElementById("rv-remark").value.trim();
    if(remark.length < 3){ toast("Please say what should change.", true); return; }
    o.status = "sp_revision"; o.revisionFrom = "client"; o.clientRemark = remark;
    o.adminRemark = "Client asked for a change: " + remark;
    closeSpModal(); toast("Sent to CGS for revision."); render();
    saveThenNotify(o, "proposal_revision", "CGS admin");
  });
}

/* ---------- admin: company registrations ---------- */
const companyState = { loaded:false, error:null };
async function loadCompaniesAdmin(){
  try{ state.companies = await CGS_SHEETS.adminCompanies(); companyState.error = null; }
  catch(err){ companyState.error = err.message; }
  companyState.loaded = true;
  updateSpCounts();
  if(currentView==="a-companies") render();
}
function companyStatusBadge(s){
  const cls = s==="approved" ? "status-delivered" : s==="rejected" ? "status-rejected" : "status-wait";
  return `<span class="status-badge ${cls}">${s==="approved"?"Approved":s==="rejected"?"Rejected":"Waiting for approval"}</span>`;
}
function viewAdminCompanies(){
  const head = `<div class="view-head"><div><h2>Company registrations</h2><p>Open the BIR Form 2303, then approve or reject. The company is e-mailed the result.</p></div><button class="btn btn-ghost btn-sm" id="cmp-refresh">Refresh</button></div>`;
  if(!CGS_SHEETS.enabled()) return head + emptyState("Connect Google Sheets","Company registrations are stored in your Google Sheet.");
  if(companyState.error) return head + `<div class="remark-box">${esc(companyState.error)}</div>`;
  if(!companyState.loaded) return head + `<p class="muted">Loading registrations…</p>`;
  const list = state.companies.slice().sort((a,b)=>(a.status==="pending"?0:1)-(b.status==="pending"?0:1) || (b.registeredAt||0)-(a.registeredAt||0));
  if(!list.length) return head + emptyState("No registrations yet","When a company registers, it shows up here.");
  return head + `<div class="table-wrap"><table>
    <thead><tr><th>Company</th><th>Address (BIR)</th><th>Email</th><th>Registered</th><th>Status</th><th></th></tr></thead>
    <tbody>${list.map(c=>`<tr>
      <td><strong>${esc(c.name)}</strong><div class="muted" style="font-size:11.5px;">${esc(c.id)}</div></td>
      <td style="max-width:260px;">${esc(c.address)}</td><td>${esc(c.email)}</td><td>${fmtDateShort(c.registeredAt)}</td>
      <td>${companyStatusBadge(c.status)}${c.reviewedBy?`<div class="muted" style="font-size:11.5px;">by ${esc(c.reviewedBy)}</div>`:""}</td>
      <td><button class="btn ${c.status==="pending"?"btn-primary":"btn-ghost"} btn-sm" data-cmp-review="${esc(c.id)}">${c.status==="pending"?"Review 2303":"View"}</button></td>
    </tr>`).join("")}</tbody></table></div>`;
}
function afterRenderAdminCompanies(){
  const r = document.getElementById("cmp-refresh"); if(r) r.addEventListener("click", ()=>{ companyState.loaded = false; render(); loadCompaniesAdmin(); });
  document.querySelectorAll("[data-cmp-review]").forEach(b=>b.addEventListener("click", ()=>openCompanyReview(b.dataset.cmpReview)));
  if(!companyState.loaded && CGS_SHEETS.enabled()) loadCompaniesAdmin();
}
async function openCompanyReview(id){
  const c = state.companies.find(x=>x.id===id); if(!c) return;
  const panel = showSpModal(`${esc(c.name)} — BIR Form 2303`,
    `<div class="pdf-box" id="cmp-pdf"><p class="muted">Loading the PDF…</p></div>
     <div class="cmp-facts"><div><span>Address (BIR)</span>${esc(c.address)}</div><div><span>Email</span>${esc(c.email)}</div><div><span>Registered</span>${fmtDate(c.registeredAt)}</div><div><span>Status</span>${companyStatusBadge(c.status)}</div></div>
     ${c.reviewNote?`<div class="remark-box"><strong>Earlier note:</strong> ${esc(c.reviewNote)}</div>`:""}
     <label>Note to the company <span class="muted">(required when rejecting)</span><textarea id="cmp-note" rows="2" placeholder="e.g. The 2303 is unclear — please upload a clearer copy."></textarea></label>`,
    `<button class="btn btn-ghost" data-sp-close>Close</button>
     ${c.status!=="rejected"?`<button class="btn btn-danger" id="cmp-reject">Reject</button>`:""}
     ${c.status!=="approved"?`<button class="btn btn-primary" id="cmp-approve">Approve</button>`:""}`);
  const decide = async decision=>{
    const note = document.getElementById("cmp-note").value.trim();
    if(decision==="reject" && note.length<3){ toast("Write a short reason so the company can fix it.", true); return; }
    if(!confirm(`${decision==="approve"?"Approve":"Reject"} ${c.name}? They will be e-mailed at ${c.email}.`)) return;
    try{
      const r = await CGS_SHEETS.reviewCompany(c.id, decision, note);
      Object.assign(c, r.company); closeSpModal(); updateSpCounts();
      toast(`${c.name} ${decision==="approve"?"approved":"rejected"}${r.mailed?" — company notified by e-mail.":" — but the e-mail couldn't be sent, please let them know."}`, !r.mailed);
      render();
    }catch(err){ toast(err.message, true); }
  };
  const ap = document.getElementById("cmp-approve"), rj = document.getElementById("cmp-reject");
  if(ap) ap.addEventListener("click", ()=>decide("approve"));
  if(rj) rj.addEventListener("click", ()=>decide("reject"));
  try{
    const r = await CGS_SHEETS.companyPdf(c.id);
    const url = base64ToBlobUrl(r.base64, "application/pdf");
    const box = document.getElementById("cmp-pdf");
    if(box) box.innerHTML = `<iframe class="pdf-frame" src="${url}" title="BIR Form 2303"></iframe><p class="muted" style="font-size:12px;margin:6px 0 0;"><a href="${url}" target="_blank" rel="noopener">Open in a new tab</a> if the preview doesn't show on your device.</p>`;
  }catch(err){ const box = document.getElementById("cmp-pdf"); if(box) box.innerHTML = `<div class="remark-box">Couldn't load the PDF: ${esc(err.message)}</div>`; }
}

/* ---------- admin: pricing -> cost proposal ---------- */
function companyStatusFor(o){ const c = state.companies.find(x=>x.id===o.companyId); return c ? c.status : null; }
function viewAdminSpPricing(){
  const orders = state.orders.filter(o=>isSPOrder(o) && SP_PRICING_STATUSES.includes(o.status)).sort((a,b)=>a.createdAt-b.createdAt);
  return `<div class="view-head"><div><h2>Pricing</h2><p>Special Projects orders arrive without prices. Enter your prices, add a discount or delivery fee if needed, and generate the cost proposal for Approver 1 and 2.</p></div></div>
  ${orders.length===0 ? emptyState("Nothing to price","New Special Projects orders and proposals returned for revision show up here.") : orders.map(o=>{
    const cs = companyStatusFor(o);
    return `<div class="ticket-card">
      <div class="ticket-top"><div>
        <div class="ticket-id">${o.id} · ${fmtDate(o.createdAt)}${o.proposal?` · Rev ${o.proposal.rev+1} of ${esc(o.proposal.no)}`:""}</div>
        <div class="ticket-title">${esc(o.company)} ${cs==="pending"?`<span class="status-badge status-wait">Company awaiting approval</span>`:""}</div>
        <div class="ticket-meta">${esc(o.userName)} — ${esc(o.userPosition)} · CP ${esc(o.cpNumber||"")} · ${esc(o.payMode||"")}</div>
        <div class="ticket-meta">Bill to: ${esc(o.billTo||"—")} · Proposal to: ${esc((o.proposalTo||{}).name||"")}, ${esc((o.proposalTo||{}).address||"")}</div>
      </div><span class="status-badge ${STATUS_CLASS[o.status]}">${STATUS_LABEL[o.status]}</span></div>
      <div class="ticket-items">${spItemRowsHTML(o)}</div>
      ${o.status==="sp_revision" ? `<div class="remark-box"><strong>Returned for revision:</strong> ${esc(o.adminRemark||"")}</div>` : ""}
      <div class="ticket-actions"><button class="btn btn-primary btn-sm" data-sp-price="${o.id}">${o.proposal?"Revise &amp; resubmit":"Price &amp; generate cost proposal"}</button></div>
    </div>`; }).join("")}`;
}
function afterRenderAdminSpPricing(){
  document.querySelectorAll("[data-sp-price]").forEach(b=>b.addEventListener("click", ()=>openSpPricingModal(b.dataset.spPrice)));
}
function openSpPricingModal(orderId){
  const o = state.orders.find(x=>x.id===orderId); if(!o) return;
  const prev = o.proposal, cs = companyStatusFor(o), blocked = cs && cs!=="approved";
  const rows = o.items.map((i,n)=>`<tr>
    <td>${n+1}</td><td><strong>${esc(i.name)}</strong>${spItemNotesHTML(i)}</td><td class="num">${esc(i.qty)} ${esc(i.oum)}</td>
    <td><input type="number" class="sp-price" data-n="${n}" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${i.rate||""}" /></td>
    <td class="num" id="sp-amt-${n}">₱0.00</td></tr>`).join("");
  showSpModal(`Price ${o.id} — ${esc(o.company)}`,
    `${blocked?`<div class="remark-box"><strong>${esc(o.company)}</strong> hasn't been approved yet. Approve the company under Companies before sending its proposal.</div>`:""}
     ${o.status==="sp_revision"?`<div class="remark-box"><strong>Returned for revision:</strong> ${esc(o.adminRemark||"")}</div>`:""}
     <div class="table-wrap"><table class="sp-price-table"><thead><tr><th>#</th><th>Item / details</th><th class="num">Qty</th><th>Unit price (₱, before VAT)</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table></div>
     <div class="sp-price-grid">
       <div>
         <label>Discount <select id="sp-dmode"><option value="none">No discount</option><option value="percent">Percent (%)</option><option value="amount">Fixed amount (₱)</option></select></label>
         <label>Discount value <input type="number" id="sp-dval" min="0" step="0.01" value="${prev?prev.discountValue||"":""}" disabled /></label>
         <label class="check"><input type="checkbox" id="sp-df" ${prev&&prev.withDF?"checked":""}/> With delivery fee (itemized)</label>
         <label>Delivery fee (₱) <input type="number" id="sp-dfamt" min="0" step="0.01" value="${prev&&prev.withDF?prev.dfAmount:""}" disabled /></label>
         <p class="muted" id="sp-df-note" style="font-size:12.5px;margin:0;">No delivery fee line — the proposal will say “Pricing includes delivery fee.”</p>
         <label>Notes printed on the proposal <textarea id="sp-notes" rows="3" placeholder="Validity, terms, lead time…">${esc(prev?prev.notes||"":"")}</textarea></label>
       </div>
       <div class="sp-totals" id="sp-totals"></div>
     </div>`,
    `<button class="btn btn-ghost" data-sp-close>Cancel</button><button class="btn btn-primary" id="sp-generate" ${blocked?"disabled":""}>${prev?"Resubmit to Approver 1":"Generate cost proposal → Approver 1"}</button>`);
  const $ = id=>document.getElementById(id);
  if(prev){ $("sp-dmode").value = prev.discountMode||"none"; }
  const read = ()=>{
    const prices = [...document.querySelectorAll(".sp-price")].map(i=>round2(i.value));
    const mode = $("sp-dmode").value, val = Number($("sp-dval").value)||0, withDF = $("sp-df").checked, df = Number($("sp-dfamt").value)||0;
    return { prices, mode, val, withDF, df, totals: spTotals(o.items.map((i,n)=>({qty:i.qty, price:prices[n]})), mode, val, withDF, df) };
  };
  const recalc = ()=>{
    const r = read(), t = r.totals;
    $("sp-dval").disabled = r.mode==="none"; $("sp-dfamt").disabled = !r.withDF;
    $("sp-df-note").classList.toggle("hidden", r.withDF);
    o.items.forEach((i,n)=>{ $("sp-amt-"+n).textContent = peso(i.qty*r.prices[n]); });
    $("sp-totals").innerHTML = `<div class="fee-row"><span>Subtotal</span><span>${peso(t.subtotal)}</span></div>
      ${t.discount>0?`<div class="fee-row"><span>Less: discount</span><span>− ${peso(t.discount)}</span></div>`:""}
      ${r.withDF?`<div class="fee-row"><span>Delivery fee</span><span>${peso(t.dfAmount)}</span></div>`:""}
      <div class="fee-row"><span>Vatable amount</span><span>${peso(t.base)}</span></div>
      <div class="fee-row"><span>VAT (12%)</span><span>${peso(t.vat)}</span></div>
      <div class="fee-row total"><span>Total amount due</span><span>${peso(t.total)}</span></div>`;
  };
  document.querySelectorAll("#sp-modal-panel input, #sp-modal-panel select").forEach(el=>el.addEventListener("input", recalc));
  recalc();
  $("sp-generate").addEventListener("click", ()=>{
    const r = read();
    if(r.prices.some(p=>!(p>0))){ toast("Enter a unit price for every item.", true); return; }
    if(r.mode==="percent" && !(r.val>=0 && r.val<=100)){ toast("A percent discount must be between 0 and 100.", true); return; }
    if(r.mode!=="none" && r.mode==="amount" && r.val > r.totals.subtotal){ toast("The discount is more than the subtotal.", true); return; }
    if(r.withDF && !(r.df>0)){ toast("Enter the delivery fee, or untick “With delivery fee”.", true); return; }
    const me = state.currentUser, now = Date.now(), rev = prev ? (prev.rev||0)+1 : 0;
    o.items.forEach((i,n)=>{ i.rate = r.prices[n]; });
    const history = (prev && prev.history) ? prev.history.slice() : [];
    history.push({ ts:now, by:me.name, role:"admin", action: prev ? "resubmitted" : "generated", remark: prev ? (o.adminRemark||"") : "" });
    o.proposal = { no:cpNumberFor(o), rev, discountMode:r.mode, discountValue:r.mode==="none"?0:r.val, withDF:r.withDF, dfAmount:r.withDF?r.df:0,
      notes:$("sp-notes").value.trim(), totals:r.totals, preparedBy:me.name, preparedByEmail:me.email, preparedAt:now, sentAt:null,
      a1:{status:"pending"}, a2:{status:"pending"}, history };
    o.status = "sp_approver1"; o.revisionFrom = null; o.adminRemark = "";
    closeSpModal(); toast(`${o.proposal.no} sent to Approver 1.`); render();
    saveThenNotify(o, "approver_pending", "Approver 1");
  });
}

/* ---------- admin: all cost proposals ---------- */
function viewAdminSpProposals(){
  const list = state.orders.filter(o=>isSPOrder(o) && o.proposal).sort((a,b)=>(b.proposal.preparedAt||0)-(a.proposal.preparedAt||0));
  return `<div class="view-head"><div><h2>Cost proposals</h2><p>Every proposal and where it is: with an approver, with the client, or signed.</p></div></div>
  ${list.length===0 ? emptyState("No proposals yet","Price an order to generate the first one.") : `<div class="table-wrap"><table>
    <thead><tr><th>Proposal</th><th>Company</th><th>Requester</th><th>Total (incl. VAT)</th><th>Stage</th><th></th></tr></thead>
    <tbody>${list.map(o=>`<tr>
      <td><strong>${esc(o.proposal.no)}</strong>${o.proposal.rev?` · Rev ${o.proposal.rev}`:""}<div class="muted" style="font-size:11.5px;">${o.id}</div></td>
      <td>${esc(o.company)}</td><td>${esc(o.userName)}</td><td>${peso(o.proposal.totals.total)}</td>
      <td><span class="status-badge ${STATUS_CLASS[o.status]}">${STATUS_LABEL[o.status]}</span>${o.proposal.a1 && o.proposal.a1.status==="approved"?`<div class="muted" style="font-size:11.5px;">A1 ✓ ${esc(o.proposal.a1.by)}${o.proposal.a2&&o.proposal.a2.status==="approved"?` · A2 ✓ ${esc(o.proposal.a2.by)}`:""}</div>`:""}</td>
      <td><button class="btn btn-ghost btn-sm" data-sp-view-admin="${o.id}">View</button>${o.signedCp?` <button class="btn btn-ghost btn-sm" data-sp-signed="${o.id}">Signed copy</button>`:""}</td>
    </tr>`).join("")}</tbody></table></div>`}`;
}
function afterRenderAdminSpProposals(){
  document.querySelectorAll("[data-sp-view-admin]").forEach(b=>b.addEventListener("click", ()=>{ const o = state.orders.find(x=>x.id===b.dataset.spViewAdmin); if(o) openProposalViewer(o); }));
  document.querySelectorAll("[data-sp-signed]").forEach(b=>b.addEventListener("click", ()=>viewSignedCp(b.dataset.spSigned)));
}
async function viewSignedCp(orderId){
  try{
    const r = await CGS_SHEETS.getSignedCp(orderId);
    const mime = r.type==="pdf" ? "application/pdf" : r.type==="png" ? "image/png" : "image/jpeg";
    const url = base64ToBlobUrl(r.base64, mime);
    if(r.type==="pdf") openPdfViewer("Signed cost proposal", url);
    else showSpModal("Signed cost proposal", `<img src="${url}" alt="Signed cost proposal" style="max-width:100%;border-radius:8px;" />`, `<button class="btn btn-ghost" data-sp-close>Close</button>`);
  }catch(err){ toast(err.message, true); }
}

/* ---------- approvers ---------- */
function approverStage(){ return state.currentUser.role==="approver1" ? 1 : 2; }
function viewApproverQueue(){
  const want = approverStage()===1 ? "sp_approver1" : "sp_approver2";
  const list = state.orders.filter(o=>o.status===want && o.proposal).sort((a,b)=>(a.proposal.preparedAt||0)-(b.proposal.preparedAt||0));
  return `<div class="view-head"><div><h2>For my approval</h2><p>You are Approver ${approverStage()}. Open a proposal to read it, then approve it or send it back to the admin with a remark.</p></div></div>
  ${list.length===0 ? emptyState("Nothing waiting for you","Cost proposals that reach your stage appear here.") : list.map(o=>`<div class="ticket-card">
    <div class="ticket-top"><div>
      <div class="ticket-id">${esc(o.proposal.no)}${o.proposal.rev?` · Rev ${o.proposal.rev}`:""} · ${o.id}</div>
      <div class="ticket-title">${esc(o.company)} <span class="muted" style="font-size:13px;">— ${esc(o.userName)}</span></div>
      <div class="ticket-meta">${o.items.length} item type(s) · ${esc(o.payMode||"")} · prepared by ${esc(o.proposal.preparedBy)} · ${fmtDate(o.proposal.preparedAt)}</div>
    </div><div class="ticket-total">${peso(o.proposal.totals.total)}<span>incl. VAT</span></div></div>
    <div class="ticket-actions"><button class="btn btn-primary btn-sm" data-ap-open="${o.id}">Review proposal</button></div></div>`).join("")}`;
}
function viewApproverHistory(){
  const me = state.currentUser, stage = approverStage();
  const rows = [];
  state.orders.filter(o=>o.proposal).forEach(o=>(o.proposal.history||[]).forEach(h=>{
    if(h.role===me.role && h.by===me.name && new RegExp("^(approved|returned)"+stage+"$").test(h.action)) rows.push({ o, h });
  }));
  rows.sort((x,y)=>y.h.ts-x.h.ts);
  return `<div class="view-head"><div><h2>My decisions</h2><p>Every proposal you approved or sent back, newest first.</p></div></div>
  ${rows.length===0 ? emptyState("No decisions yet","Your approvals and returns will be listed here.") : `<div class="table-wrap"><table>
    <thead><tr><th>Proposal</th><th>Company</th><th>Total (current)</th><th>My decision</th><th>When</th><th>Where it is now</th></tr></thead>
    <tbody>${rows.map(({o,h})=>`<tr><td><strong>${esc(o.proposal.no)}</strong></td><td>${esc(o.company)}</td><td>${peso(o.proposal.totals.total)}</td>
      <td>${/^approved/.test(h.action)?"Approved":"Returned"}${h.remark?`<div class="muted" style="font-size:11.5px;">${esc(h.remark)}</div>`:""}</td><td>${fmtDate(h.ts)}</td><td>${STATUS_LABEL[o.status]}</td></tr>`).join("")}</tbody></table></div>`}`;
}
function afterRenderApprover(){
  document.querySelectorAll("[data-ap-open]").forEach(b=>b.addEventListener("click", ()=>openApprovalModal(b.dataset.apOpen)));
}
function openApprovalModal(orderId){
  const o = state.orders.find(x=>x.id===orderId), stage = approverStage();
  if(!o || o.status !== (stage===1 ? "sp_approver1" : "sp_approver2")){ toast("This proposal is no longer waiting for you.", true); render(); return; }
  showSpModal(`Approval — ${esc(o.proposal.no)}`,
    `${proposalDocHTML(o)}<label class="sp-remark">Remark <span class="muted">(required when sending back)</span><textarea id="ap-remark" rows="2" placeholder="e.g. Please apply the 5% volume discount."></textarea></label>`,
    `<button class="btn btn-ghost" id="ap-print">Print</button><button class="btn btn-danger" id="ap-return">Send back for revision</button><button class="btn btn-primary" id="ap-approve">Approve</button>`);
  document.getElementById("ap-print").addEventListener("click", ()=>printProposal(o));
  document.getElementById("ap-approve").addEventListener("click", ()=>decideProposal(o, stage, true));
  document.getElementById("ap-return").addEventListener("click", ()=>decideProposal(o, stage, false));
}
function decideProposal(o, stage, approve){
  const remark = document.getElementById("ap-remark").value.trim();
  if(!approve && remark.length<3){ toast("Write a short remark so the admin knows what to change.", true); return; }
  const me = state.currentUser, now = Date.now(), key = stage===1 ? "a1" : "a2";
  o.proposal[key] = { status: approve?"approved":"rejected", by:me.name, email:me.email, at:now, remark };
  o.proposal.history = (o.proposal.history||[]).concat([{ ts:now, by:me.name, role:me.role, action:(approve?"approved":"returned")+stage, remark }]);
  let kind, who;
  if(approve && stage===1){ o.status = "sp_approver2"; kind = "approver_pending"; who = "Approver 2"; }
  else if(approve){ o.status = "sp_client"; o.proposal.sentAt = now; kind = "proposal_ready"; who = "the client"; }
  else { o.status = "sp_revision"; o.revisionFrom = me.role; o.adminRemark = `Returned by Approver ${stage}: ${remark}`; kind = "proposal_revision"; who = "CGS admin"; }
  closeSpModal();
  toast(approve ? (stage===1 ? "Approved — sent to Approver 2." : "Approved — the cost proposal is on its way to the client.") : "Sent back to the admin for revision.");
  render();
  saveThenNotify(o, kind, who);
}


/* ============================================================
   BILLING — after delivery the admin issues a billing amount; the requester pays and
   attaches the receipt; the admin confirms it. Unpaid bills can be chased by e-mail.
   ============================================================ */
const BILL_STATUS = { unpaid:"Unpaid", for_confirmation:"Receipt sent — waiting for CGS", paid:"Paid" };
const BILL_CLASS = { unpaid:"status-wait", for_confirmation:"status-prep", paid:"status-delivered" };
function todayISO(offsetDays){ const d = new Date(Date.now() + (offsetDays||0)*86400000); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function billNoFor(o){ return "BILL-" + String(o.id).replace(/^TCK-/,""); }
function billingDefaultAmount(o){ return isSPOrder(o) && o.proposal ? o.proposal.totals.total : round2(orderTotal(o) + (o.totalBilled||0)); }
function billOverdue(b){ return !!b && b.status!=="paid" && !!b.dueDate && b.dueDate < todayISO(); }
function billBadge(b){ return `<span class="status-badge ${BILL_CLASS[b.status]}">${BILL_STATUS[b.status]}</span>${billOverdue(b)?` <span class="status-badge status-rejected">Overdue</span>`:""}`; }
function fmtDue(iso){ return iso ? fmtDateShort(new Date(iso+"T00:00:00").getTime()) : "—"; }
function billingChipHTML(o){
  if(!o.billing) return "";
  return `<div class="bill-chip"><span>Billing <strong>${esc(o.billing.no)}</strong> · ${peso(o.billing.amount)}</span>${billBadge(o.billing)}<button class="linklike" data-go-billing>View billing</button></div>`;
}
function openReceiptViewer(title, r){
  const mime = r.type==="pdf" ? "application/pdf" : r.type==="png" ? "image/png" : "image/jpeg";
  const url = base64ToBlobUrl(r.base64, mime);
  if(r.type==="pdf") return openPdfViewer(title, url);
  return showSpModal(title, `<img src="${url}" alt="${esc(title)}" style="max-width:100%;border-radius:8px;" />`, `<button class="btn btn-ghost" data-sp-close>Close</button>`);
}
async function viewReceipt(orderId, fileId){
  try{ const r = await CGS_SHEETS.getReceipt(orderId, fileId); openReceiptViewer("Payment receipt", r); }
  catch(err){ toast(err.message, true); }
}

/* ---------- admin ---------- */
let billingFilter = "action";
function billingGroup(o){ return o.billing ? o.billing.status : "tobill"; }
function viewAdminBilling(){
  const all = state.orders.filter(o=>o.status==="delivered" || o.billing);
  const count = g=>all.filter(o=>billingGroup(o)===g).length;
  const unpaidTotal = round2(all.filter(o=>o.billing && o.billing.status!=="paid").reduce((s,o)=>s+o.billing.amount,0));
  const overdue = all.filter(o=>billOverdue(o.billing)).length;
  const filters = [["action","Needs action"],["tobill","To bill"],["unpaid","Unpaid"],["for_confirmation","For confirmation"],["paid","Paid"],["all","All"]];
  const match = o=>{ const g = billingGroup(o); return billingFilter==="all" || (billingFilter==="action" ? (g==="tobill" || g==="for_confirmation" || billOverdue(o.billing)) : g===billingFilter); };
  const rows = all.filter(match).sort((a,b)=>(b.deliveredAt||b.createdAt||0)-(a.deliveredAt||a.createdAt||0));
  const actions = o=>{
    const b = o.billing;
    if(!b) return `<button class="btn btn-primary btn-sm" data-bill-issue="${o.id}">Issue billing</button>`;
    if(b.status==="unpaid") return `<button class="btn btn-ghost btn-sm" data-bill-remind="${o.id}">Send reminder</button> <button class="btn btn-ghost btn-sm" data-bill-edit="${o.id}">Edit</button> <button class="btn btn-ghost btn-sm" data-bill-paid="${o.id}">Mark paid</button>`;
    if(b.status==="for_confirmation") return `<button class="btn btn-primary btn-sm" data-bill-review="${o.id}">Review receipt</button>`;
    return (b.receipts||[]).length ? `<button class="btn btn-ghost btn-sm" data-bill-review="${o.id}">View receipt</button>` : "";
  };
  return `<div class="view-head"><div><h2>Billing</h2><p>Bill delivered tickets, check the payment receipts people attach, and remind anyone who hasn't paid.</p></div></div>
  <div class="kpi-row">
    <div class="kpi-card ${count("tobill")?'warn':''}"><div class="kpi-label">To bill</div><div class="kpi-value">${count("tobill")}</div></div>
    <div class="kpi-card"><div class="kpi-label">Unpaid</div><div class="kpi-value">${peso(unpaidTotal)}</div></div>
    <div class="kpi-card ${count("for_confirmation")?'warn':''}"><div class="kpi-label">Receipts to confirm</div><div class="kpi-value">${count("for_confirmation")}</div></div>
    <div class="kpi-card ${overdue?'warn':''}"><div class="kpi-label">Overdue</div><div class="kpi-value">${overdue}</div></div>
  </div>
  <div class="filter-bar">${filters.map(([k,l])=>`<button class="chip ${billingFilter===k?"active":""}" data-bill-filter="${k}">${l}</button>`).join("")}</div>
  ${rows.length===0 ? emptyState("Nothing here","No tickets match this filter.") : `<div class="table-wrap"><table>
    <thead><tr><th>Ticket</th><th>Requester</th><th>Billing</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${rows.map(o=>{ const b = o.billing; return `<tr>
      <td><strong>${o.id}</strong><div class="muted" style="font-size:11.5px;">${esc(o.company||o.township)}${isSPOrder(o)?" · SP":""}</div><div class="muted" style="font-size:11.5px;">Delivered ${o.deliveredAt?fmtDateShort(o.deliveredAt):"—"}</div></td>
      <td>${esc(o.userName)}</td>
      <td>${b?`<strong>${peso(b.amount)}</strong><div class="muted" style="font-size:11.5px;">${esc(b.no)}</div>`:`<span class="muted">Suggested ${peso(billingDefaultAmount(o))}</span>`}</td>
      <td>${b?fmtDue(b.dueDate):"—"}</td>
      <td>${b?billBadge(b):`<span class="status-badge status-new">Not billed</span>`}${b&&(b.reminders||[]).length?`<div class="muted" style="font-size:11.5px;">${b.reminders.length} reminder${b.reminders.length>1?"s":""} · last ${fmtDateShort(b.reminders[b.reminders.length-1].ts)}</div>`:""}${b&&b.rejectNote&&b.status==="unpaid"?`<div class="muted" style="font-size:11.5px;">Receipt rejected: ${esc(b.rejectNote)}</div>`:""}</td>
      <td><div class="bill-actions">${actions(o)}</div></td></tr>`; }).join("")}</tbody></table></div>`}`;
}
function afterRenderAdminBilling(){
  const find = id=>state.orders.find(o=>o.id===id);
  document.querySelectorAll("[data-bill-filter]").forEach(b=>b.addEventListener("click", ()=>{ billingFilter = b.dataset.billFilter; render(); }));
  document.querySelectorAll("[data-bill-issue]").forEach(b=>b.addEventListener("click", ()=>openBillingModal(find(b.dataset.billIssue), false)));
  document.querySelectorAll("[data-bill-edit]").forEach(b=>b.addEventListener("click", ()=>openBillingModal(find(b.dataset.billEdit), true)));
  document.querySelectorAll("[data-bill-remind]").forEach(b=>b.addEventListener("click", ()=>sendBillingReminder(find(b.dataset.billRemind))));
  document.querySelectorAll("[data-bill-paid]").forEach(b=>b.addEventListener("click", ()=>openMarkPaidModal(find(b.dataset.billPaid))));
  document.querySelectorAll("[data-bill-review]").forEach(b=>b.addEventListener("click", ()=>openReceiptReview(find(b.dataset.billReview))));
}
function openBillingModal(o, editing){
  const b = editing ? o.billing : null, me = state.currentUser;
  const hint = isSPOrder(o) && o.proposal ? `Cost proposal ${esc(o.proposal.no)} total (incl. 12% VAT): ${peso(o.proposal.totals.total)}`
    : `Items ${peso(orderTotal(o))} + delivery fee ${peso(o.totalBilled||0)}`;
  showSpModal(`${editing?"Edit billing":"Issue billing"} — ${o.id}`,
    `<p class="muted" style="margin:0 0 10px;font-size:13px;">${esc(o.userName)} · ${esc(o.company||o.township)}${o.payMode?` · pays by ${esc(o.payMode)}`:""}<br>${hint}</p>
     <label>Billing amount (₱) <span class="req">*</span><input type="number" id="bl-amount" min="0.01" step="0.01" inputmode="decimal" value="${b?b.amount:billingDefaultAmount(o)}" /></label>
     <label>Due date <input type="date" id="bl-due" value="${b?(b.dueDate||""):todayISO(15)}" /></label>
     <label>Note to the requester <textarea id="bl-note" rows="2" placeholder="Bank details, reference number, payment terms…">${esc(b?b.note||"":"")}</textarea></label>
     <p class="muted" style="font-size:12px;margin:0;">The requester is e-mailed and sees this under Billing, where they can attach their payment receipt.</p>`,
    `<button class="btn btn-ghost" data-sp-close>Cancel</button><button class="btn btn-primary" id="bl-save">${editing?"Save changes":"Issue billing"}</button>`, { narrow:true });
  document.getElementById("bl-save").addEventListener("click", ()=>{
    const amount = round2(document.getElementById("bl-amount").value);
    if(!(amount>0)){ toast("Enter the billing amount.", true); return; }
    const dueDate = document.getElementById("bl-due").value, note = document.getElementById("bl-note").value.trim();
    const changedAmount = !editing || b.amount!==amount;
    if(editing){ Object.assign(o.billing, { amount, dueDate, note }); }
    else o.billing = { no:billNoFor(o), amount, issuedAt:Date.now(), issuedBy:me.name, dueDate, note, status:"unpaid", receipts:[], reminders:[] };
    closeSpModal(); render();
    toast(editing ? "Billing updated." : `Billing ${o.billing.no} issued to ${o.userName}.`);
    if(changedAmount) saveThenNotify(o, "billing_issued", o.userName); else CGS_SHEETS.saveNow(snapshotState);
  });
}
function sendBillingReminder(o){
  const b = o.billing; if(!b || b.status==="paid") return;
  const last = (b.reminders||[]).length ? b.reminders[b.reminders.length-1].ts : 0;
  if(last && Date.now()-last < 3600000 && !confirm("A reminder was sent less than an hour ago. Send another?")) return;
  if(!confirm(`E-mail a payment reminder for ${peso(b.amount)} to ${o.userName}?`)) return;
  b.reminders = (b.reminders||[]).concat([{ ts:Date.now(), by:state.currentUser.name }]);
  render(); toast(`Reminder sent to ${o.userName}.`);
  saveThenNotify(o, "billing_reminder", o.userName);
}
function openMarkPaidModal(o){
  showSpModal(`Mark ${esc(o.billing.no)} as paid`, `<p style="margin:0 0 8px;">Use this when the payment arrived without a receipt upload (cash, check handed over, etc.).</p><label>Reference / note <textarea id="mp-note" rows="2" placeholder="e.g. OR no. 1234, check no. 56789"></textarea></label>`,
    `<button class="btn btn-ghost" data-sp-close>Cancel</button><button class="btn btn-primary" id="mp-save">Confirm payment of ${peso(o.billing.amount)}</button>`, { narrow:true });
  document.getElementById("mp-save").addEventListener("click", ()=>{ confirmPayment(o, document.getElementById("mp-note").value.trim()); });
}
function confirmPayment(o, note){
  const b = o.billing, me = state.currentUser;
  Object.assign(b, { status:"paid", paidAt:Date.now(), confirmedBy:me.name, confirmNote:note, rejectNote:null });
  closeSpModal(); render(); toast(`${b.no} marked as paid.`);
  saveThenNotify(o, "payment_confirmed", o.userName);
}
async function openReceiptReview(o){
  const b = o.billing, recs = b.receipts||[];
  showSpModal(`${esc(b.no)} — ${esc(o.userName)}`,
    `<div class="cmp-facts"><div><span>Amount billed</span><strong>${peso(b.amount)}</strong></div><div><span>Due</span>${fmtDue(b.dueDate)}</div><div><span>Status</span>${billBadge(b)}</div><div><span>Pays by</span>${esc(o.payMode||"—")}</div></div>
     <div class="bill-receipts">${recs.length?recs.map((r,n)=>`<button class="chip ${n===recs.length-1?"active":""}" data-rc="${n}">${esc(r.name)} · ${fmtDateShort(r.at)}${r.rejected?" (rejected)":""}</button>`).join(""):`<span class="muted">No receipt attached.</span>`}</div>
     <div class="pdf-box" id="rc-view"><p class="muted">${recs.length?"Loading the receipt…":""}</p></div>
     ${b.status==="for_confirmation"?`<label>Note <span class="muted">(required when rejecting)</span><textarea id="rc-note" rows="2" placeholder="e.g. The amount on the receipt doesn't match the billing."></textarea></label>`:`${b.confirmedBy?`<p class="muted">Confirmed by ${esc(b.confirmedBy)} on ${fmtDateShort(b.paidAt)}${b.confirmNote?` — ${esc(b.confirmNote)}`:""}</p>`:""}`}`,
    `<button class="btn btn-ghost" data-sp-close>Close</button>${b.status==="for_confirmation"?`<button class="btn btn-danger" id="rc-reject">Reject receipt</button><button class="btn btn-primary" id="rc-confirm">Confirm payment</button>`:""}`);
  const load = async n=>{
    const r = recs[n]; if(!r) return;
    const box = document.getElementById("rc-view"); if(box) box.innerHTML = `<p class="muted">Loading the receipt…</p>`;
    document.querySelectorAll("[data-rc]").forEach(c=>c.classList.toggle("active", Number(c.dataset.rc)===n));
    try{
      const f = await CGS_SHEETS.getReceipt(o.id, r.fileId);
      const url = base64ToBlobUrl(f.base64, f.type==="pdf"?"application/pdf":f.type==="png"?"image/png":"image/jpeg");
      if(box) box.innerHTML = f.type==="pdf" ? `<iframe class="pdf-frame" src="${url}" title="Receipt"></iframe>` : `<img src="${url}" alt="Payment receipt" style="max-width:100%;border-radius:8px;" />`;
    }catch(err){ if(box) box.innerHTML = `<div class="remark-box">Couldn't load the receipt: ${esc(err.message)}</div>`; }
  };
  document.querySelectorAll("[data-rc]").forEach(c=>c.addEventListener("click", ()=>load(Number(c.dataset.rc))));
  const cf = document.getElementById("rc-confirm"), rj = document.getElementById("rc-reject");
  if(cf) cf.addEventListener("click", ()=>confirmPayment(o, (document.getElementById("rc-note").value||"").trim()));
  if(rj) rj.addEventListener("click", ()=>{
    const reason = document.getElementById("rc-note").value.trim();
    if(reason.length<3){ toast("Write why the receipt can't be accepted, so they can fix it.", true); return; }
    b.status = "unpaid"; b.rejectNote = reason; b.receipts = recs.map(r=>({ ...r, rejected:true }));
    closeSpModal(); render(); toast("Receipt rejected — the requester was asked to attach a correct one.");
    saveThenNotify(o, "receipt_rejected", o.userName);
  });
  if(recs.length) load(recs.length-1);
}

/* ---------- requester ---------- */
function viewUserBilling(){
  const list = myOrders().filter(o=>o.billing).sort((a,b)=>b.billing.issuedAt-a.billing.issuedAt);
  const toPay = round2(list.filter(o=>o.billing.status==="unpaid").reduce((s,o)=>s+o.billing.amount,0));
  const waiting = list.filter(o=>o.billing.status==="for_confirmation").length;
  const paid = round2(list.filter(o=>o.billing.status==="paid").reduce((s,o)=>s+o.billing.amount,0));
  const card = o=>{ const b = o.billing; return `<div class="ticket-card">
    <div class="ticket-top"><div>
      <div class="ticket-id">${esc(b.no)} · ticket ${o.id} · issued ${fmtDateShort(b.issuedAt)}</div>
      <div class="ticket-title bill-amount">${peso(b.amount)}</div>
      <div class="ticket-meta">${esc(o.company||o.township)} · due ${fmtDue(b.dueDate)}${o.payMode?` · ${esc(o.payMode)}`:""}</div>
    </div>${billBadge(b)}</div>
    ${b.note?`<div class="remark-box"><strong>From CGS:</strong> ${esc(b.note)}</div>`:""}
    ${b.rejectNote&&b.status==="unpaid"?`<div class="remark-box"><strong>Your last receipt wasn't accepted:</strong> ${esc(b.rejectNote)}</div>`:""}
    ${(b.receipts||[]).length?`<div class="bill-receipts">${b.receipts.map(r=>`<button class="chip" data-receipt-view="${o.id}" data-fid="${esc(r.fileId)}">${esc(r.name)} · ${fmtDateShort(r.at)}${r.rejected?" (not accepted)":""}</button>`).join("")}</div>`:""}
    <div class="ticket-actions">
      ${b.status!=="paid" ? `<label class="btn btn-primary btn-sm file-btn">${b.status==="for_confirmation"?"Attach another receipt":"Attach payment receipt"}<input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" data-receipt-for="${o.id}" /></label>` : ""}
      ${b.status==="for_confirmation" ? `<span class="muted" style="font-size:12.5px;">CGS will confirm your payment shortly.</span>` : ""}
      ${b.status==="paid" ? `<span class="muted" style="font-size:12.5px;">Paid — confirmed ${fmtDateShort(b.paidAt)}${b.confirmNote?` · ${esc(b.confirmNote)}`:""}</span>` : ""}
    </div></div>`; };
  return `<div class="view-head"><div><h2>Billing</h2><p>CGS bills your tickets after delivery. Pay, then attach your payment receipt here so we can confirm it.</p></div></div>
  <div class="kpi-row">
    <div class="kpi-card ${toPay?'warn':''}"><div class="kpi-label">To pay</div><div class="kpi-value">${peso(toPay)}</div></div>
    <div class="kpi-card"><div class="kpi-label">Waiting for CGS to confirm</div><div class="kpi-value">${waiting}</div></div>
    <div class="kpi-card"><div class="kpi-label">Paid</div><div class="kpi-value">${peso(paid)}</div></div>
  </div>
  ${list.length ? list.map(card).join("") : emptyState("No billing yet","CGS issues a billing once your ticket is delivered. It will show up here, and you'll get an e-mail.")}`;
}
function afterRenderBilling(){
  document.querySelectorAll("[data-receipt-for]").forEach(inp=>inp.addEventListener("change", ()=>{ const f = inp.files[0]; if(f) submitReceipt(inp.dataset.receiptFor, f); inp.value = ""; }));
  document.querySelectorAll("[data-receipt-view]").forEach(b=>b.addEventListener("click", ()=>viewReceipt(b.dataset.receiptView, b.dataset.fid)));
}
async function submitReceipt(orderId, file){
  const o = state.orders.find(x=>x.id===orderId); if(!o || !o.billing || o.billing.status==="paid") return;
  const okType = /^(application\/pdf|image\/jpeg|image\/png)$/.test(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
  if(!okType){ toast("Attach the receipt as a PDF, JPG or PNG.", true); return; }
  if(file.size > 8*1024*1024){ toast("That file is over 8 MB. Please attach a smaller one.", true); return; }
  toast("Uploading your receipt…");
  try{
    const data = await CGS_SHEETS.fileToBase64(file);
    const r = await CGS_SHEETS.uploadReceipt(orderId, file.name, data);
    const b = o.billing;
    b.receipts = (b.receipts||[]).concat([{ fileId:r.fileId, name:r.name, type:r.type, at:Date.now(), by:state.currentUser.name }]);
    b.status = "for_confirmation"; b.rejectNote = null;
    toast("Receipt attached — CGS will confirm your payment.");
    render();
    saveThenNotify(o, "receipt_attached", "CGS");
  }catch(err){ toast("Couldn't upload the receipt: " + err.message, true); }
}

/* ---------------------------- LIVE REFRESH ---------------------------------
   Every ~20 seconds (and when you come back to the tab) the app asks the Sheet one tiny question —
   "has anything changed?" — and only reloads when the answer is yes. It never reloads while you have
   unsaved changes, a pop-up open, or are typing, so it can't wipe out what you're doing. */
CGS_SHEETS.POLL_MS = 20000;
let liveTimer = null, liveBusy = false;
function userIsBusy(){
  const a = document.activeElement;
  return !!document.querySelector(".modal.open") || document.getElementById("cart-drawer").classList.contains("open") ||
         (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type!=="checkbox" && a.type!=="radio" && a.type!=="button" && a.getClientRects().length>0);   // only a field you can actually see
}
async function liveSync(){
  if(liveBusy || !state.currentUser || !CGS_SHEETS.enabled() || !CGS_SHEETS.loaded || !CGS_SHEETS.token) return;
  if(document.hidden || CGS_SHEETS._saving || CGS_SHEETS._pending || userIsBusy()) return;
  liveBusy = true;
  try{
    const v = await CGS_SHEETS.version();
    if(v === CGS_SHEETS.dataVersion) return;
    const data = await CGS_SHEETS.loadAll(); if(!data) return;
    if(CGS_SHEETS._saving || CGS_SHEETS._pending || userIsBusy() || !state.currentUser) return;   // something started while we were loading: try again next round
    ingestBundle(data, state.currentUser);
    render();
  }catch(e){ /* offline or signed out: try again next round */ }
  finally{ liveBusy = false; }
}
function restartLiveSync(){
  clearInterval(liveTimer);
  liveTimer = setInterval(liveSync, CGS_SHEETS.POLL_MS);
}
restartLiveSync();
document.addEventListener("visibilitychange", ()=>{ if(!document.hidden) liveSync(); });
window.addEventListener("focus", ()=>liveSync());

/* ---------------------------- GOOGLE SHEETS SYNC ---------------------------
   snapshotState() is what gets pushed to the Sheet (debounced, see
   sheets-api.js) on every render(). hydrateFromRemote() is the reverse:
   it replaces the local demo state with whatever was last saved, run once
   at startup if a Web App URL is configured and reachable.
   ---------------------------------------------------------------------------*/
function snapshotState(){
  return {
    orders: state.orders, catalog: CATALOG, vehicles: VEHICLES,
    townships: state.townshipsList.map(n=>({ name:n, legalName:(state.townshipInfo[n]||{}).legalName||"", address:(state.townshipInfo[n]||{}).address||"" })),
    availabilityLog: state.availabilityLog,
    orderSeq: state.orderSeq
  };
}
function hydrateFromRemote(data){
  if(Array.isArray(data.catalog) && data.catalog.length) CATALOG = data.catalog;
  if(Array.isArray(data.vehicles) && data.vehicles.length) VEHICLES = data.vehicles;
  state.orders = Array.isArray(data.orders) ? data.orders : [];
  state.availabilityLog = Array.isArray(data.availabilityLog) ? data.availabilityLog : [];
  state.orderSeq = data.orderSeq || (state.orders.length+1);
}

/* ---------------------------- INIT ------------------------------------------
   LIMITATIONS of this prototype:
   - Email sending and SMS are still simulated in-memory (toast messages).
   - "Capture PNG" uses html2canvas (loaded from cdnjs) to snapshot the
     current filtered view; "Export PDF" uses the browser's print dialog
     with a print stylesheet that hides chrome (sidebar/topbar/buttons).
   - Google Sheets is now wired as the data store via sheets-api.js + the
     Apps Script Web App in apps-script/Code.gs — see sheets-api.js for the
     one-time setup steps. Until a Web App URL is pasted in there, the app
     falls back to the original in-memory demo data (nothing persists
     between reloads), exactly like before.
   ---------------------------------------------------------------------------*/
/* Nothing is read from the Sheet until somebody signs in. The only thing that can happen here is
   picking up a "Remember me" session, and the server answers that with the person's data. */
async function boot(){
  if(!CGS_SHEETS.enabled()){ seedDemoOrders(); ensureTownshipInfo(); return; }
  const sess = readRememberedSession();
  if(!sess) return;
  try{
    const r = await CGS_SHEETS.validateSession(sess.token);
    finishSignIn(r.user, sess.token, true, r.data);
  }catch(err){ if(!/reach|fetch|network|failed/i.test(err.message)) ls.del("cgs_session"); }
}
bootReady = boot();
