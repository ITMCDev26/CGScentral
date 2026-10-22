/* CGS Central — Client side billing: e-SOA, "hard copy released" notice, and payment-receipt upload. */
(function(){
const esc = v => escAttr(v), seen = new Set();
const mine = () => state.orders.filter(o=>o.userEmail===state.currentUser.email && o.billing && o.billing.distributedAt)
  .sort((a,b)=>b.billing.distributedAt-a.billing.distributedAt);
const label = b => b.status==="paid" ? "Paid — thank you" : b.status==="for_confirmation" ? "Receipt sent — waiting for CGS to confirm" : "Unpaid";
window.updateClientBillPill = function(){
  const u = state.currentUser; if(!u || u.role!=="user") return;
  const open = mine().filter(o=>o.billing.status!=="paid");
  ["billing-count","sp-billing-count"].forEach(id=>setPill(id, open.length));
  const fresh = open.filter(o=>!seen.has(o.id)); fresh.forEach(o=>seen.add(o.id));
  if(fresh.length) toast("New billing "+fresh.map(o=>o.billing.no).join(", ")+": the hard copy was released from the CGS office and will be brought by the office messenger. You can view the e-SOA under Billing.");
};
window.viewUserBilling = function(){
  const list = mine();
  return `<div class="view-head"><div><h2>Billing</h2><p>Your statements of account. After you pay, attach a copy of your payment receipt so CGS can clear your billing.</p></div></div>
  ${list.length?list.map(o=>{ const b=o.billing; return `<div class="ticket-card"><div class="ticket-head"><strong>Billing No. ${b.no}</strong> <span class="muted">· Ticket ${o.id}</span></div>
    <div class="ticket-meta">Amount due <strong>${peso(b.amount)}</strong> · Period ${esc(b.period||"")} · Status: <strong>${label(b)}</strong></div>
    ${b.status!=="paid"?`<div class="remark-box">📦 The hard copy of this billing was released from the CGS office on ${fmtDateShort(b.distributedAt)} and will be brought to you by the office messenger.</div>`:""}
    ${b.rejectNote&&b.status==="unpaid"?`<div class="remark-box"><strong>Receipt not accepted:</strong> ${esc(b.rejectNote)}</div>`:""}
    ${(b.receipts||[]).length?`<div class="ticket-meta">Receipts sent: ${b.receipts.map(r=>esc(r.name)).join(", ")}</div>`:""}
    <div class="ticket-actions"><button class="btn btn-ghost btn-sm" data-cb-view="${o.id}">View / print e-SOA</button>
    ${b.status==="paid"?"":`<label class="btn btn-primary btn-sm" style="cursor:pointer">Attach payment receipt<input type="file" accept="application/pdf,image/jpeg,image/png" data-cb-up="${o.id}" hidden></label>`}</div></div>`; }).join(""):emptyState("No billings yet","Billings appear here once CGS releases them to you.")}`;
};
window.afterRenderUserBilling = function(){
  document.querySelectorAll("[data-cb-view]").forEach(b=>b.addEventListener("click",()=>window.printBilling(b.dataset.cbView)));
  document.querySelectorAll("[data-cb-up]").forEach(inp=>inp.addEventListener("change",async()=>{
    const f = inp.files[0], o = state.orders.find(x=>x.id===inp.dataset.cbUp); if(!f||!o) return;
    if(f.size > 8*1024*1024){ toast("That file is over 8 MB.", true); return; }
    try{
      let rec = { name:f.name, at:Date.now() };
      if(CGS_SHEETS.enabled()){
        const r = await CGS_SHEETS.uploadReceipt(o.id, f.name, await CGS_SHEETS.fileToBase64(f));
        rec = { fileId:r.fileId, type:r.type, name:r.name, at:Date.now() };
      }
      o.billing.receipts = (o.billing.receipts||[]).concat([rec]); o.billing.status = "for_confirmation"; o.billing.rejectNote = "";
      toast("Receipt attached — CGS will confirm your payment."); render();
      if(CGS_SHEETS.enabled()) CGS_SHEETS.saveNow(snapshotState).then(()=>CGS_SHEETS.notify(o.id,"receipt_attached"));
    }catch(err){ toast(err.message, true); }
  }));
};
})();
