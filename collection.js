/* CGS Central — Collection team: billings passed by GA, distribution, unpaid dashboard, 10-day follow-ups, notes. */
(function(){
const DAY = 86400000, FOLLOW_DAYS = 10, F = { client:"ALL", show:"unpaid" };
const esc = v => escAttr(v);
const mine = () => state.orders.filter(o=>o.billing && o.billing.passedAt);
const clientOf = o => o.company || o.userName;
const isPaid = o => o.billing.status==="paid";
const lastTouch = o => o.billing.lastFollowUp || o.billing.distributedAt;
const dueFollow = o => o.billing.distributedAt && !isPaid(o) && (Date.now()-lastTouch(o)) >= FOLLOW_DAYS*DAY;
const stageOf = o => isPaid(o) ? "Paid" : o.billing.status==="for_confirmation" ? "Receipt — for confirmation" : o.billing.distributedAt ? "Distributed · unpaid" : "Received from GA — to distribute";
function note(o, text, followUp){
  const b = o.billing; b.notes = (b.notes||[]).concat([{ at:Date.now(), by:state.currentUser.name, text }]);
  if(followUp) b.lastFollowUp = Date.now();
}
function sync(o, kind){ if(CGS_SHEETS.enabled()) CGS_SHEETS.saveNow(snapshotState).then(()=>CGS_SHEETS.notify(o.id, kind)); }
window.viewCollection = function(){
  const all = mine(), unpaid = all.filter(o=>!isPaid(o)), due = unpaid.filter(dueFollow);
  const rows = all.filter(o=>(F.client==="ALL"||clientOf(o)===F.client) && (F.show==="all" || !isPaid(o)));
  setPill("c-collection", due.length + all.filter(o=>!o.billing.distributedAt).length);
  const tot = unpaid.reduce((s,o)=>s+(o.billing.amount||0),0);
  return `<div class="view-head"><div><h2>Collection</h2><p>Billings passed by GA. Distribute them, follow up every ${FOLLOW_DAYS} days, and confirm payments.</p></div></div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px"><div><strong>${unpaid.length}</strong> unpaid</div><div>Outstanding <strong>${peso(tot)}</strong></div>
    <div style="${due.length?"color:#b00020":""}"><strong>${due.length}</strong> follow-up due</div><div><strong>${all.filter(o=>!o.billing.distributedAt).length}</strong> to distribute</div></div>
  <div style="display:flex;gap:12px;margin-bottom:12px">
    <label>Client <select data-col="client"><option value="ALL">All</option>${[...new Set(all.map(clientOf))].sort().map(c=>`<option ${F.client===c?"selected":""} value="${esc(c)}">${esc(c)}</option>`).join("")}</select></label>
    <label>Show <select data-col="show"><option value="unpaid" ${F.show==="unpaid"?"selected":""}>Unpaid only</option><option value="all" ${F.show==="all"?"selected":""}>All billings</option></select></label></div>
  <div class="table-wrap"><table><thead><tr><th>Billing</th><th>Client</th><th>Ticket</th><th>Amount</th><th>Stage</th><th>Last follow-up</th><th>Notes</th><th></th></tr></thead><tbody>
  ${rows.length?rows.map(o=>{ const b=o.billing; return `<tr style="${dueFollow(o)?"background:#fff4f4":""}"><td>${b.no}</td><td>${esc(clientOf(o))}</td><td>${o.id}</td><td>${peso(b.amount)}</td>
    <td>${stageOf(o)}${dueFollow(o)?' <b style="color:#b00020">· follow-up due</b>':""}</td><td>${b.distributedAt?fmtDateShort(lastTouch(o)):"—"}</td>
    <td>${(b.notes||[]).slice(-2).map(n=>`<div style="font-size:12px">${fmtDateShort(n.at)} ${esc(n.by)}: ${esc(n.text)}</div>`).join("")||"—"}</td>
    <td style="white-space:nowrap">${!b.distributedAt?`<button class="btn btn-sm btn-primary" data-col-dist="${o.id}">Billing distributed</button>`:""}
      ${b.distributedAt&&!isPaid(o)?`<button class="btn btn-sm btn-ghost" data-col-note="${o.id}">Log follow-up</button>`:""}
      ${b.status==="for_confirmation"?`<button class="btn btn-sm btn-primary" data-col-paid="${o.id}">Confirm payment</button> <button class="btn btn-sm btn-ghost" data-col-rej="${o.id}">Reject receipt</button>`:""}
      ${(b.receipts||[]).length?`<button class="btn btn-sm btn-ghost" data-col-rcpt="${o.id}">View receipt</button>`:""} <button class="btn btn-sm btn-ghost" data-col-print="${o.id}">View</button></td></tr>`; }).join(""):`<tr><td colspan="8" class="muted">Nothing here.</td></tr>`}
  </tbody></table></div>`;
};
window.afterRenderCollection = function(){
  const q = (s,fn)=>document.querySelectorAll(s).forEach(fn), get = id=>state.orders.find(x=>x.id===id);
  q("[data-col]", el=>el.addEventListener("change",()=>{ F[el.dataset.col]=el.value; render(); }));
  q("[data-col-dist]", el=>el.addEventListener("click",()=>{ const o=get(el.dataset.colDist);
    if(!confirm("Mark billing "+o.billing.no+" as distributed to the client? The client is told the hard copy was released from the office and will be brought by the office messenger.")) return;
    o.billing.distributedAt = Date.now(); o.billing.distributedBy = state.currentUser.name; o.billing.status = o.billing.status||"unpaid";
    note(o, "Billing distributed.", true); toast("Marked distributed — the client is notified."); render(); sync(o,"billing_issued"); }));
  q("[data-col-note]", el=>el.addEventListener("click",()=>{ const o=get(el.dataset.colNote);
    const t = prompt("Follow-up note for "+clientOf(o)+" — billing "+o.billing.no+" (status, who you spoke to, promised date):"); if(!t||!t.trim()) return;
    note(o, t.trim(), true); toast("Follow-up logged."); render(); }));
  q("[data-col-paid]", el=>el.addEventListener("click",()=>{ const o=get(el.dataset.colPaid);
    if(!(o.billing.receipts||[]).length){ toast("No receipt attached.", true); return; }
    if(!confirm("Confirm payment received for billing "+o.billing.no+"?")) return;
    o.billing.status="paid"; o.billing.paidAt=Date.now(); note(o,"Payment confirmed.",true); toast("Payment confirmed."); render(); sync(o,"payment_confirmed"); }));
  q("[data-col-rej]", el=>el.addEventListener("click",()=>{ const o=get(el.dataset.colRej);
    const t = prompt("Why is the receipt not accepted?"); if(!t||!t.trim()) return;
    o.billing.status="unpaid"; o.billing.rejectNote=t.trim(); note(o,"Receipt rejected: "+t.trim(),true); toast("Receipt rejected."); render(); sync(o,"receipt_rejected"); }));
  q("[data-col-rcpt]", el=>el.addEventListener("click",async()=>{ const o=get(el.dataset.colRcpt), r=(o.billing.receipts||[]).slice(-1)[0];
    if(!CGS_SHEETS.enabled()||!r.fileId){ toast("Receipt: "+r.name); return; }
    try{ const f = await CGS_SHEETS.getReceipt(o.id, r.fileId); window.open(base64ToBlobUrl(f.base64, {pdf:"application/pdf",jpg:"image/jpeg",png:"image/png"}[f.type]||"application/pdf"), "_blank"); }
    catch(err){ toast(err.message, true); } }));
  q("[data-col-print]", el=>el.addEventListener("click",()=>window.printBilling(el.dataset.colPrint)));
  const due = mine().filter(o=>!isPaid(o)&&dueFollow(o)).length;
  if(due && !window.__colNagged){ window.__colNagged=true; toast(due+" billing(s) are due for a follow-up (every "+FOLLOW_DAYS+" days).", true); }
};
})();
