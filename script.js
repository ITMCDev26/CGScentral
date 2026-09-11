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
  if(it.image){ return `<img src="${it.image}" alt="${it.name}" style="width:100%;height:100%;object-fit:cover;">`; }
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
const STAGE_INDEX = { new:0, awaiting_ack:1, rejected:1, preparation:2, ready_for_btt:3, ready_for_dr:4, for_delivery:5, delivered:6 };
const STATUS_LABEL = {
  new:"New ticket", awaiting_ack:"Waiting for your approval", rejected:"Rejected",
  preparation:"In preparation", ready_for_btt:"Ready for BTT", ready_for_dr:"Ready for DR",
  for_delivery:"Out for delivery", delivered:"Delivered"
};
const STATUS_CLASS = {
  new:"status-new", awaiting_ack:"status-wait", rejected:"status-rejected",
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
  orders: [], // tickets — one segment per ticket
  orderSeq: 1,
  townshipsList: [...TOWNSHIPS],
  deliveryLogs: [], // finalized BTT trips: {id, vehicleId, releaseAt, deliveredAt, bttNumber, tickets:[ids], feeTotal, breakdown, hours}
  availabilityLog: [], // history of items that came out of production or were marked unavailable
  notices: [], // {id, userEmail, seen, message, ticketId} — queued pop-ups for "your item is now available"
};

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
    o.items.forEach(item=>{
      if(item.avail==="production" && item.etaDate && !item.released){
        const eta = new Date(item.etaDate+"T00:00:00");
        if(eta.getTime() <= today.getTime()) releaseItem(o, item);
      }
    });
  });
}
function releaseItem(order, item){
  item.released = true;
  item.avail = "released";
  const t = makeOrder(
    { email:order.userEmail, name:order.userName, position:order.userPosition },
    [{ itemId:item.itemId, name:item.name, segment:item.segment, rate:item.rate, oum:item.oum, qty:item.qty, avail:"available" }],
    order.township, order.segment, (order.batchId||order.id)+"-R"
  );
  t.status = "preparation"; t.prepStatus = "ongoing";
  t.confirmedAt = Date.now(); t.ackAt = Date.now();
  t.parentTicket = order.id;
  t.adminRemark = `Auto-released from ${order.id} — item became available on ${fmtDateShort(new Date(item.etaDate+"T00:00:00").getTime())}.`;
  state.orders.push(t);
  item.releasedTo = t.id;
  state.availabilityLog.push({
    id:"AVL-"+Date.now()+"-"+Math.floor(Math.random()*1000), ts:Date.now(),
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
  toast(CGS_SHEETS.enabled() ? "CSV snapshot downloaded — live data is already syncing to your connected Sheet." : "CSV snapshot downloaded. Connect a Google Sheet (see sheets-api.js) for live, automatic syncing.");
}

/* ---------------------------- AUTH ----------------------------------------*/
const authScreen = document.getElementById("auth-screen");
const appEl = document.getElementById("app");

document.querySelectorAll(".auth-tab").forEach(tab=>{
  tab.addEventListener("click", ()=>{
    document.querySelectorAll(".auth-tab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    const mode = tab.dataset.auth;
    document.getElementById("signin-form").classList.toggle("hidden", mode!=="signin");
    document.getElementById("signup-form").classList.toggle("hidden", mode!=="signup");
  });
});
document.getElementById("fill-user").addEventListener("click",()=>{
  document.getElementById("si-email").value="user@megaworldcorp.com";
  document.getElementById("si-password").value="demo";
});
document.getElementById("fill-admin").addEventListener("click",()=>{
  document.getElementById("si-email").value="admin@megaworldcorp.com";
  document.getElementById("si-password").value="demo";
});
document.getElementById("signin-form").addEventListener("submit", e=>{
  e.preventDefault();
  const email = document.getElementById("si-email").value.trim().toLowerCase();
  const pass = document.getElementById("si-password").value;
  const u = state.users.find(u=>u.email.toLowerCase()===email);
  if(!u){ toast("No account found for that email.", true); return; }
  if(u.password !== pass && pass !== "demo"){ toast("Incorrect password.", true); return; }
  login(u);
});
document.getElementById("signup-form").addEventListener("submit", e=>{
  e.preventDefault();
  const name = document.getElementById("su-name").value.trim();
  const position = document.getElementById("su-position").value.trim();
  const email = document.getElementById("su-email").value.trim().toLowerCase();
  const password = document.getElementById("su-password").value;
  if(state.users.some(u=>u.email.toLowerCase()===email)){ toast("An account with that email already exists.", true); return; }
  const project = email.endsWith("@megaworldcorp.com") ? "megaworld" : "special";
  const u = {name, position, email, password, role:"user", project};
  state.users.push(u);
  toast(project==="special" ? "Account created. Special Projects access is coming in Phase 2 — signing you in to a limited preview." : "Account created — welcome to CGS Central.");
  login(u);
});
function login(u){
  state.currentUser = u;
  authScreen.classList.add("hidden");
  appEl.classList.remove("hidden");
  document.getElementById("who-name").textContent = u.name;
  document.getElementById("who-role").textContent = u.role==="admin" ? "CGS Admin · "+u.project : "Requester · "+u.project;
  const isAdmin = u.role==="admin";
  document.getElementById("nav-user").classList.toggle("hidden", isAdmin);
  document.getElementById("nav-admin").classList.toggle("hidden", !isAdmin);
  document.getElementById("open-cart-btn").classList.toggle("hidden", isAdmin);
  navigate(isAdmin ? "a-overview" : "u-dashboard");
}
document.getElementById("logout-btn").addEventListener("click", ()=>{
  state.currentUser = null; state.cart = [];
  appEl.classList.add("hidden");
  authScreen.classList.remove("hidden");
});

/* ---------------------------- NAVIGATION -----------------------------------*/
const viewTitles = {
  "u-dashboard":"Dashboard", "u-shop":"Shop", "u-ack":"Acknowledge orders", "u-confirm":"Confirm Delivery",
  "a-overview":"Overview", "a-new":"New Orders", "a-confirm":"Confirmation of Orders",
  "a-prep":"Preparation of Orders", "a-btt":"BTT Assignment", "a-dr":"DR Generator",
  "a-delivery":"For Delivery", "a-delivered":"Delivered Items", "a-history":"Overall Delivery History",
  "a-edit":"Edit Orders", "a-vehicles":"Vehicle Summary", "a-item-summary":"Item Summary",
  "a-items":"Items & Pricing", "a-availability":"Availability Watch"
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
  const count = state.cart.reduce((s,c)=>s+c.qty,0);
  const el = document.getElementById("cart-count");
  el.textContent = count;
  el.classList.toggle("zero", count===0);
}
function renderCart(){
  const wrap = document.getElementById("cart-items");
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
    const lines = bySeg[seg].map(({it,c})=>`<div class="co-summary-row"><span>${it.name} × ${c.qty} ${it.oum}</span><strong>${peso(it.rate*c.qty)}</strong></div>`).join("");
    return `<div style="margin-bottom:8px;"><div class="item-segment" style="margin-bottom:4px;">${seg} — separate ticket</div>${lines}</div>`;
  }).join("");
  const total = state.cart.reduce((s,c)=>{ const it=CATALOG.find(i=>i.id===c.itemId); return s+it.rate*c.qty; },0);
  document.getElementById("co-summary").innerHTML = `<p class="muted" style="font-size:12px;margin-bottom:10px;">This will create <strong>${segCount}</strong> ticket${segCount>1?"s":""} — one per segment.</p>` + rows +
    `<div class="co-summary-row" style="border-top:1px solid var(--sand);margin-top:6px;padding-top:8px;"><span><strong>Total</strong></span><strong>${peso(total)}</strong></div>`;
  cartDrawer.classList.remove("open");
  openModal("checkout-modal");
});

document.getElementById("place-order-btn").addEventListener("click", ()=>{
  const township = document.getElementById("co-township").value;
  const bySeg = {};
  state.cart.forEach(c=>{ const it=CATALOG.find(i=>i.id===c.itemId); (bySeg[it.segment]=bySeg[it.segment]||[]).push({itemId:it.id,name:it.name,segment:it.segment,rate:it.rate,oum:it.oum,qty:c.qty,avail:null}); });
  const batchId = "BATCH-"+Date.now();
  const created = [];
  Object.keys(bySeg).forEach(seg=>{
    const t = makeOrder(state.currentUser, bySeg[seg], township, seg, batchId);
    state.orders.push(t); created.push(t.id);
  });
  state.cart = [];
  updateCartBadge();
  closeModal("checkout-modal");
  toast(`${created.length} ticket${created.length>1?"s":""} placed (${created.join(", ")}) — CGS will confirm availability shortly.`);
  navigate("u-dashboard");
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
function updateAdminCounts(){
  const el = document.getElementById("c-new");
  if(el){ const n = state.orders.filter(o=>o.status==="new").length; el.textContent=n; el.classList.toggle("zero", n===0); }
  const pEl = document.getElementById("c-prod");
  if(pEl){
    const n = state.orders.reduce((s,o)=>s+o.items.filter(i=>i.avail==="production" && !i.released).length, 0);
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
  const cur = order.status==="rejected" ? -1 : STAGE_INDEX[order.status];
  return `<div class="stage-tracker">${STAGES.map((label,i)=>{
    const done = order.status!=="rejected" && i<cur;
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
  return `<span class="type-badge ${o.deliveryType}">TYPE ${o.deliveryType}</span> ${o.noBtt?'<span class="nobtt-badge">NO BTT</span>':''}`;
}

/* ============================================================
   USER VIEWS
   ============================================================ */
function myOrders(){ return state.orders.filter(o=>o.userEmail===state.currentUser.email).sort((a,b)=>b.createdAt-a.createdAt); }

function viewUserDashboard(){
  const orders = myOrders();
  const ongoing = orders.filter(o=>!["delivered","rejected"].includes(o.status)).length;
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
    ${o.adminRemark ? `<div class="remark-box"><strong>CGS note:</strong> ${o.adminRemark}</div>` : ""}
    ${o.status==="awaiting_ack" ? `<div class="ticket-actions"><button class="btn btn-primary btn-sm" data-ack="${o.id}">Acknowledge &amp; proceed</button></div>` : ""}
    ${!o.customerConfirmedAt && (o.status==="for_delivery"||o.status==="delivered") ? `<div class="ticket-actions"><button class="btn btn-primary btn-sm" data-confirm-delivery="${o.id}">Confirm delivery received</button></div>` : ""}
  </div>`;
}

function viewUserShop(){
  return `
  <div class="view-head">
    <div><h2>Shop CGS items</h2><p>Search, add to cart and check out — just like ordering online. Items from different segments become separate tickets.</p></div>
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
  return items.map(it=>{
    const qty = cartQty(it.id);
    return `<div class="item-card">
      <div class="item-thumb">${itemImageHTML(it)}</div>
      <div class="item-body">
        <div class="item-segment">${it.segment}</div>
        <div class="item-name">${it.name}</div>
        <div class="item-price">${peso(it.rate)}<span class="item-oum"> / ${it.oum}</span></div>
        <div class="item-foot">
          <div class="qty-stepper">
            <button data-shop-dec="${it.id}">−</button><span id="qty-${it.id}">${qty||1}</span><button data-shop-inc="${it.id}">+</button>
          </div>
          <button class="add-btn ${qty?'added':''}" data-add="${it.id}">${qty?`In cart (${qty})`:"Add to cart"}</button>
        </div>
      </div>
    </div>`;
  }).join("");
}
const draftQty = {};
function afterRenderShop(){
  document.getElementById("shop-search").addEventListener("input", e=>{ shopState.q=e.target.value; document.getElementById("item-grid").innerHTML = renderItemGrid(); afterRenderShop(); });
  document.querySelectorAll("[data-seg]").forEach(b=>b.addEventListener("click", ()=>{ shopState.segment=b.dataset.seg; render(); }));
  document.querySelectorAll("[data-shop-inc]").forEach(b=>b.addEventListener("click", ()=>{
    const id=b.dataset.shopInc; draftQty[id]=(draftQty[id]|| (cartQty(id)||1))+1; document.getElementById("qty-"+id).textContent=draftQty[id];
  }));
  document.querySelectorAll("[data-shop-dec]").forEach(b=>b.addEventListener("click", ()=>{
    const id=b.dataset.shopDec; draftQty[id]=Math.max(1,(draftQty[id]|| (cartQty(id)||1))-1); document.getElementById("qty-"+id).textContent=draftQty[id];
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
  const ongoing = orders.filter(o=>!["delivered","rejected"].includes(o.status)).length;
  const closed = orders.filter(o=>o.status==="delivered").length;
  const overdue = orders.filter(o=>o.status==="new" && hoursBetween(o.createdAt, Date.now())>48);
  const delivered = orders.filter(o=>o.deliveredAt);
  const avgH = delivered.length ? delivered.reduce((s,o)=>s+hoursBetween(o.createdAt,o.deliveredAt),0)/delivered.length : 0;
  const totalSales = orders.reduce((s,o)=>s+orderTotal(o),0);
  return `
  <div class="view-head"><div><h2>CGS operations overview</h2><p>Live status across the order-to-delivery pipeline.</p>
      <p class="muted" style="font-size:12px;margin-top:6px;">${CGS_SHEETS.enabled() ? "🟢 Connected to Google Sheets — changes save automatically." : "⚪ Not connected to Google Sheets — running on local demo data. Add your Apps Script Web App URL in sheets-api.js to enable live persistence."}</p>
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
        <div class="ticket-meta">${o.township} · ${o.items.length} item type(s) · ${peso(orderTotal(o))}${o.drNumber?` · DR ${o.drNumber}`:""}</div>
      </div>
      <span class="status-badge ${STATUS_CLASS[o.status]}">${o.late?"Late delivery":STATUS_LABEL[o.status]}</span>
    </div>
    <div class="ticket-items">
      ${o.items.map(i=>`<div class="ticket-item-row"><span>${i.name} × ${i.qty} ${i.oum}</span><span>${itemAvailLabel(i)}</span></div>`).join("")}
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
    o.status="rejected"; o.adminRemark="Order rejected — CGS does not carry these items.";
    toast(`Order ${o.id} rejected.`, true); render();
  }));
}
function openReviewModal(orderId){
  const o = state.orders.find(o=>o.id===orderId);
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
        <div><span>Township</span>${o.township}</div>
        <div><span>Vehicle</span>${vehicle?vehicle.name+" — "+vehicle.driver:"—"}</div>
        <div><span>Delivery date</span>${fmtDateShort(new Date(o.deliveryDate).getTime())}</div>
      </div>
      <label style="display:block;max-width:260px;margin-bottom:14px;">IOM number
        <input value="${o.iomNumber||''}" data-iom="${o.id}" placeholder="e.g. IOM-08-2026" style="width:100%;margin-top:4px;padding:8px 10px;border:1.5px solid var(--sand);border-radius:8px;font-family:inherit;" />
      </label>
      <div class="ticket-items">
        ${o.items.filter(i=>i.avail==='available').map(i=>`<div class="ticket-item-row"><span>${i.name} × ${i.qty} ${i.oum}</span><span>${peso(i.rate*i.qty)}</span></div>`).join("")}
      </div>
      <div class="ticket-actions">
        <button class="btn btn-ghost btn-sm" onclick="window.print()">Print / Download PDF</button>
        <button class="btn btn-primary btn-sm" data-confirm-dr="${o.id}">Confirm &amp; send to delivery</button>
      </div>
    </div>`;}).join("")}`;
}
function afterRenderAdminDR(){
  document.querySelectorAll("[data-iom]").forEach(inp=>inp.addEventListener("change", ()=>{
    const o = state.orders.find(o=>o.id===inp.dataset.iom); o.iomNumber = inp.value.trim();
  }));
  document.querySelectorAll("[data-confirm-dr]").forEach(b=>b.addEventListener("click", ()=>{
    const o = state.orders.find(o=>o.id===b.dataset.confirmDr);
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
      <label>Township <select id="eo-township">${TOWNSHIPS.map(t=>`<option ${o.township===t?'selected':''}>${t}</option>`).join("")}</select></label>
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
    o.township = document.getElementById("eo-township").value;
    o.status = document.getElementById("eo-status").value;
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
      <label>Image URL <input id="ni-image" value="${it.image||''}" placeholder="https://… (leave blank for the default icon)" /></label>
      <div class="form-grid-2">
        <label>Rate (₱) <input id="ni-rate" type="number" min="0" step="0.01" value="${it.rate}"/></label>
        <label>Stock <input id="ni-stock" type="number" min="0" value="${it.stock}" /></label>
      </div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" data-close="generic-modal">Cancel</button><button class="btn btn-primary" id="save-item-btn">${existing?"Save changes":"Add to catalog"}</button></div>`;
  panel.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click", ()=>closeModal("generic-modal")));
  document.getElementById("save-item-btn").addEventListener("click", ()=>{
    const name = document.getElementById("ni-name").value.trim();
    const rate = parseFloat(document.getElementById("ni-rate").value);
    if(!name || !rate){ toast("Add a name and rate first.", true); return; }
    const data = { segment:document.getElementById("ni-segment").value, name, rate,
      oum:document.getElementById("ni-oum").value||"pc", stock:parseInt(document.getElementById("ni-stock").value,10)||0,
      image: document.getElementById("ni-image").value.trim()||null };
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

/* --- Availability watch (production ETAs + availability history) --- */
function viewAdminAvailability(){
  const pending = [];
  state.orders.forEach(o=>o.items.forEach((i,idx)=>{
    if(i.avail==="production" && !i.released) pending.push({o,i,idx});
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
    <thead><tr><th>When</th><th>Ticket</th><th>Item</th><th>Qty</th><th>Township</th><th>Result</th><th>New ticket</th></tr></thead>
    <tbody>
      ${history.map(h=>`<tr><td>${fmtDate(h.ts)}</td><td>${h.orderId}</td><td>${h.itemName}</td><td>${h.qty}</td><td>${h.township}</td>
        <td><span class="status-badge ${h.result==='available'?'status-delivered':'status-rejected'}">${h.result==='available'?'Available':'Not available'}</span></td>
        <td>${h.newTicketId||"—"}</td></tr>`).join("")}
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
  "a-items": viewAdminItems, "a-availability": viewAdminAvailability
};
function afterRender(view){
  if(view==="u-shop") afterRenderShop();
  if(view==="u-dashboard" || view==="u-ack" || view==="u-confirm") afterRenderUser();
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
  if(view==="a-availability") afterRenderAdminAvailability();
  maybeShowAvailabilityNotice();
}

/* ---------------------------- GOOGLE SHEETS SYNC ---------------------------
   snapshotState() is what gets pushed to the Sheet (debounced, see
   sheets-api.js) on every render(). hydrateFromRemote() is the reverse:
   it replaces the local demo state with whatever was last saved, run once
   at startup if a Web App URL is configured and reachable.
   ---------------------------------------------------------------------------*/
function snapshotState(){
  return {
    orders: state.orders, catalog: CATALOG, vehicles: VEHICLES, users: state.users,
    townships: state.townshipsList, availabilityLog: state.availabilityLog,
    orderSeq: state.orderSeq
  };
}
function hydrateFromRemote(data){
  if(Array.isArray(data.catalog) && data.catalog.length) CATALOG = data.catalog;
  if(Array.isArray(data.vehicles) && data.vehicles.length) VEHICLES = data.vehicles;
  if(Array.isArray(data.users) && data.users.length) state.users = data.users;
  if(Array.isArray(data.townships) && data.townships.length) state.townshipsList = data.townships.map(t=>typeof t==="string"?t:t.name);
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
async function boot(){
  const remote = await CGS_SHEETS.loadAll();
  if(remote && Array.isArray(remote.orders) && remote.orders.length){
    hydrateFromRemote(remote);
  } else {
    seedDemoOrders();
  }
  if(state.currentUser) render();
}
boot();
