/* CGS Central — GA billing module: delivered-items dashboard, billing editor, printable invoice (billing_format.pdf layout). */
(function(){
const F = { client:"ALL", month:"ALL", year:"ALL", segment:"ALL" };
let editId = null;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const esc = v => escAttr(v);
const delivered = () => state.orders.filter(o=>o.status==="delivered" && !isVoidOrder(o));
const clientOf = o => o.company || o.userName;
const stamp = o => o.deliveredAt || o.releaseAt || o.createdAt;
function filtered(){
  return delivered().filter(o=>{
    const d = new Date(stamp(o));
    return (F.client==="ALL"||clientOf(o)===F.client) && (F.month==="ALL"||d.getMonth()===+F.month) &&
           (F.year==="ALL"||d.getFullYear()===+F.year) && (F.segment==="ALL"||o.segment===F.segment);
  });
}
function nextNo(){
  const n = state.orders.reduce((m,o)=>Math.max(m, o.billing ? parseInt(o.billing.no,10)||0 : 0), 0) + 1;
  return String(n).padStart(7,"0");
}
function calc(o, ewt){
  const total = orderTotal(o), net = total/1.12, vat = total-net, wt = net*(Number(ewt)||0)/100;
  return { total, net, vat, wt, due: net+vat-wt };
}
function lineRows(o){
  return o.items.filter(i=>!i.avail||i.avail==="available").map(i=>({
    desc: (i.name||i.itemName||i.description||"Item") + (i.size?` (${i.size})`:""), qty:i.qty, rate:i.rate, amt:i.rate*i.qty }));
}
function invoiceHTML(o, b){
  const c = calc(o, b.ewt), m = n=>Number(n).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
  const shared = (o.sharedTownships||[]).length ? `<div class="inv-note">Shared with: ${o.sharedTownships.map(t=>t.name||t).join(", ")}</div>` : "";
  return `<div class="inv-sheet">
  <div class="inv-head"><b>INTEGRATED TOWN MANAGEMENT COPORATION</b><small>G/F 331 Building, 331 Sen. Gil Puyat Avenue, Bel-Air NCR, Fourth District, City of Makati NCR 1209<br>VAT Reg. TIN #: 239-354-733-00000</small></div>
  <div class="inv-title"><b>BILLING INVOICE</b><b>NO. <span class="inv-red">${b.no}</span></b></div>
  <div class="inv-sold"><div><b>SOLD TO</b><p><b>Registered Name:</b> ${esc(b.name)}</p><p><b>Business Address:</b> ${esc(b.address)}</p><p><b>TIN:</b> ${esc(b.tin)}</p>
    <p><b>Billed to:</b> ${esc(b.billedName)}${b.billedPos?`, ${esc(b.billedPos)}`:""}${b.billedAddress?` — ${esc(b.billedAddress)}`:""}</p></div>
    <div><p><b>Date:</b> ${esc(b.date)}</p><p><b>Period:</b> ${esc(b.period)}</p></div></div>
  <table class="inv-items"><thead><tr><th>ITEM DESCRIPTION/NATURE OF SERVICE</th><th>QUANTITY</th><th>UNIT COST/PRICE</th><th>AMOUNT</th></tr></thead>
    <tbody>${lineRows(o).map(l=>`<tr><td>${esc(l.desc)}</td><td>${l.qty}</td><td>${m(l.rate)}</td><td>${m(l.amt)}</td></tr>`).join("")}</tbody></table>
  ${shared}
  <div class="inv-totals"><div><b>VATable Sales</b> ${m(c.net)}<br><b>VAT</b> ${m(c.vat)}<br><b>Zero Rated-Sales</b> 0.00<br><b>VAT-Exempt Sales</b> 0.00</div>
    <div><b>Total Sales (VAT Inclusive)</b> ${m(c.total)}<br><b>Less: VAT</b> ${m(c.vat)}<br><b>Amount Net of VAT</b> ${m(c.net)}<br><b>Add: VAT</b> ${m(c.vat)}<br><b>Less: Withholding Tax (${b.ewt||0}%)</b> ${m(c.wt)}<br><b>TOTAL AMOUNT DUE</b> ${m(c.due)}</div></div>
  <div class="inv-pay">Please make all checks payable to <b>INTEGRATED TOWN MANAGEMENT CORPORATION</b>.</div>
  <div class="inv-foot">"THIS DOCUMENT IS VALID FOR CLAIMING INPUT TAXES"</div></div>`;
}
const INV_CSS = `.inv-sheet{font:12px Calibri,Arial,sans-serif;color:#000;background:#fff;width:100%;max-width:780px;margin:0 auto;padding:16px;box-sizing:border-box}
.inv-head{text-align:center}.inv-head b{font-size:16px;display:block}.inv-head small{font-size:10px}
.inv-title{display:flex;justify-content:space-between;margin:10px 40px;font-size:16px}.inv-red{color:#e00}
.inv-sold{display:flex;justify-content:space-between;margin-bottom:10px}.inv-sold p{margin:4px 0}
.inv-items{width:100%;border:1.5px solid #000;border-collapse:collapse;min-height:300px}.inv-items th{border-bottom:1.5px solid #000;padding:4px;font-size:11px}
.inv-items td{padding:3px 6px}.inv-items td:nth-child(n+2){text-align:right}.inv-items tbody{vertical-align:top}
.inv-items{display:table}.inv-totals{display:flex;justify-content:space-between;border:1.5px solid #000;border-top:0;padding:8px;line-height:1.7}
.inv-pay{border:1.5px solid #000;border-top:0;padding:3px;font-size:11px}.inv-foot{text-align:right;font:12px Arial;margin-top:4px}.inv-note{font-size:11px;padding:4px}`;
function bFor(o){
  return o.billing || { no:nextNo(), date:new Date().toISOString().slice(0,10),
    period: new Date(stamp(o)).toLocaleDateString("en-PH",{month:"long",year:"numeric"}),
    name:o.company||o.userName, address:o.companyAddress||o.billAddress||"", tin:o.tin||"", ewt:0,
    billedName:o.billedName||o.userName, billedPos:o.billedPosition||o.userPosition, billedAddress:o.billAddress||"" };
}
/* Fields the Apps Script reads (amount, status, dueDate, receipts) are set here so billings and payment receipts line up. */
function stamp_(o,b){ const c = calc(o,b.ewt); b.amount = Math.round(c.due*100)/100; b.status = (o.billing&&o.billing.status)||"unpaid";
  b.receipts = (o.billing&&o.billing.receipts)||[]; b.createdAt = (o.billing&&o.billing.createdAt)||Date.now(); o.billing = b; }
window.printBilling = function(id){
  const o = state.orders.find(x=>x.id===id); if(!o) return;
  const w = window.open("","_blank"); if(!w){ toast("Allow pop-ups to print.", true); return; }
  w.document.write(`<title>Billing ${bFor(o).no}</title><style>@page{size:letter;margin:12mm}${INV_CSS}</style>${invoiceHTML(o,bFor(o))}`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(), 300);
};
window.viewGaBilling = function(){
  if(editId) return editorHTML();
  const rows = filtered(), all = delivered();
  const uniq = f => [...new Set(all.map(f))].sort();
  const sel = (k, opts, lab) => `<label>${lab}<select data-ga="${k}"><option value="ALL">All</option>${opts.map(([v,t])=>`<option value="${esc(v)}" ${String(F[k])===String(v)?"selected":""}>${esc(t)}</option>`).join("")}</select></label>`;
  const sum = rows.reduce((s,o)=>s+orderTotal(o),0);
  return `<div class="view-head"><div><h2>Billing — delivered items</h2><p>Filter, open a ticket to create its billing, then print.</p></div>
    <button class="btn btn-ghost" id="ga-export">Export Excel (.csv)</button></div>
  <div class="filters" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">
    ${sel("client",uniq(clientOf).map(v=>[v,v]),"Client")}${sel("month",MONTHS.map((m,i)=>[i,m]),"Month")}
    ${sel("year",uniq(o=>new Date(stamp(o)).getFullYear()).map(v=>[v,v]),"Year")}${sel("segment",uniq(o=>o.segment).map(v=>[v,v]),"Segment")}</div>
  <p><strong>${rows.length}</strong> delivered ticket(s) · Total <strong>${peso(sum)}</strong> · Billed ${rows.filter(o=>o.billing).length}</p>
  <div class="table-wrap"><table><thead><tr><th>Ticket</th><th>Client</th><th>Segment</th><th>Township</th><th>Delivered</th><th>Amount</th><th>Billing</th><th></th></tr></thead><tbody>
  ${rows.length?rows.map(o=>`<tr><td>${o.id}</td><td>${esc(clientOf(o))}</td><td>${o.segment||"—"}</td><td>${o.township}</td><td>${fmtDateShort(stamp(o))}</td><td>${peso(orderTotal(o))}</td>
    <td>${o.billing?"No. "+o.billing.no+(o.billing.passedAt?" · with collection":""):"Not yet"}</td><td>${o.billing&&o.billing.passedAt?"":`<button class="btn btn-sm btn-primary" data-ga-open="${o.id}">${o.billing?"Edit":"Create"}</button> `}${o.billing&&!o.billing.passedAt?`<button class="btn btn-sm btn-ghost" data-ga-pass="${o.id}">Pass to collection</button>`:""}</td></tr>`).join(""):`<tr><td colspan="8" class="muted">Nothing matches these filters.</td></tr>`}
  </tbody></table></div>`;
};
function editorHTML(){
  const o = state.orders.find(x=>x.id===editId), b = bFor(o);
  const inp = (k,l,t="text") => `<label>${l}<input type="${t}" data-f="${k}" value="${esc(b[k])}"></label>`;
  return `<div class="view-head"><div><h2>Billing for ${o.id}</h2></div><div><button class="btn btn-ghost" id="ga-back">Back</button> <button class="btn btn-ghost" id="ga-print">Print</button> <button class="btn btn-primary" id="ga-save">Save billing</button> <button class="btn btn-ghost" id="ga-savepass">Save &amp; pass to collection</button></div></div>
  <div style="display:grid;grid-template-columns:minmax(260px,320px) 1fr;gap:16px;align-items:start">
    <div class="ga-form" style="display:grid;gap:8px">${inp("name","Registered name")}${inp("address","Business address")}${inp("tin","TIN")}${inp("billedName","Billed to (name)")}${inp("billedPos","Billed to (position)")}${inp("billedAddress","Billed to (address)")}${inp("date","Date","date")}${inp("period","Period")}
      <label>EWT<select data-f="ewt">${[0,1,2].map(v=>`<option value="${v}" ${+b.ewt===v?"selected":""}>${v?v+"%":"None"}</option>`).join("")}</select></label></div>
    <div id="ga-preview" style="overflow:auto;background:#eee;padding:8px"><style>${INV_CSS}</style><div id="ga-sheet">${invoiceHTML(o,b)}</div></div></div>`;
}
window.afterRenderGaBilling = function(){
  const q = s=>document.querySelectorAll(s);
  q("[data-ga]").forEach(el=>el.addEventListener("change",()=>{ F[el.dataset.ga]=el.value; render(); }));
  q("[data-ga-open]").forEach(el=>el.addEventListener("click",()=>{ editId=el.dataset.gaOpen; render(); }));
  q("[data-ga-pass]").forEach(el=>el.addEventListener("click",()=>{
    const o = state.orders.find(x=>x.id===el.dataset.gaPass);
    if(!o||!o.billing||o.billing.passedAt) return;
    if(!confirm("Pass billing "+o.billing.no+" to the collection team? You won't be able to edit it afterwards. Remember to turn over the hard copy.")) return;
    o.billing.passedAt = Date.now(); o.billing.passedBy = state.currentUser.name;
    toast("Billing "+o.billing.no+" passed to collection. Turn over the hard copy."); render(); }));
  const ex = document.getElementById("ga-export");
  if(ex) ex.onclick = ()=>{
    const rows=[["Ticket","Client","Segment","Township","Delivered","Item","Qty","Unit price","Amount","Billing No.","EWT %"]];
    filtered().forEach(o=>lineRows(o).forEach(l=>rows.push([o.id,clientOf(o),o.segment,o.township,fmtDateShort(stamp(o)),l.desc,l.qty,l.rate,l.amt,o.billing?o.billing.no:"",o.billing?o.billing.ewt:""])));
    downloadCSV(rows,"billing-"+new Date().toISOString().slice(0,10)+".csv");
  };
  if(!editId) return;
  const o = state.orders.find(x=>x.id===editId), b = bFor(o);
  q("[data-f]").forEach(el=>el.addEventListener("input",()=>{
    b[el.dataset.f]=el.value; document.getElementById("ga-sheet").innerHTML=invoiceHTML(o,b); }));
  document.getElementById("ga-back").onclick = ()=>{ editId=null; render(); };
  document.getElementById("ga-save").onclick = ()=>{ if(o.billing && o.billing.passedAt){ toast("This billing is already with collection and can no longer be edited.", true); return; }
    stamp_(o,b); toast("Billing "+b.no+" saved."); render(); };
  document.getElementById("ga-savepass").onclick = ()=>{
    if(o.billing && o.billing.passedAt) return;
    if(!confirm("Save and pass billing "+b.no+" to the collection team? It can't be edited afterwards.")) return;
    stamp_(o,b); o.billing.passedAt = Date.now(); o.billing.passedBy = state.currentUser.name;
    toast("Billing "+b.no+" passed to collection. Turn over the hard copy."); editId=null; render(); };
  document.getElementById("ga-print").onclick = ()=>{ if(!o.billing || !o.billing.passedAt) stamp_(o,b); printBilling(o.id); };
};
})();
