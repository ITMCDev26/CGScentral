/* CGS Central — Admin: deliveries the client hasn't confirmed within 24 hours. Admin calls the client to close the ticket;
   if it can't be closed, the ticket still moves on (billing is unaffected) and is removed from the client's list. */
(function(){
const HOURS = 24, esc = v => escAttr(v);
const startOf = o => o.deliveredAt || o.releaseAt;
const pending = () => state.orders.filter(o=>!isVoidOrder(o) && (o.status==="delivered"||o.status==="for_delivery") &&
  !o.customerConfirmedAt && !o.confirmDropped && startOf(o) && Date.now()-startOf(o) >= HOURS*3600000);
window.updateCallPill = function(){
  const u = state.currentUser; if(!u || u.role!=="admin") return;
  const n = pending().length; setPill("c-callclient", n);
  if(n && !window.__callNagged){ window.__callNagged = true; toast(n+" delivered ticket(s) weren't confirmed by the client within 24 hours — please call them.", true); }
};
window.viewCallClients = function(){
  const rows = pending().sort((a,b)=>startOf(a)-startOf(b));
  const done = state.orders.filter(o=>o.confirmCall).length;
  return `<div class="view-head"><div><h2>Call clients</h2><p>These deliveries have gone ${HOURS} hours without the client confirming receipt. Call the client to close the ticket. If it can't be closed, record that — the ticket still proceeds to billing and disappears from the client's Confirm Delivery list.</p></div></div>
  <p class="muted">${rows.length} waiting for a call · ${done} already handled</p>
  <div class="table-wrap"><table><thead><tr><th>Ticket</th><th>Client</th><th>Contact no.</th><th>Township</th><th>Delivered / released</th><th>Waiting</th><th></th></tr></thead><tbody>
  ${rows.length?rows.map(o=>`<tr><td>${o.id}</td><td>${esc(o.company||o.userName)}<div class="muted" style="font-size:11.5px">${esc(o.userName)}${o.userPosition?", "+esc(o.userPosition):""}</div></td><td>${esc(o.contactNo||"—")}</td><td>${esc(o.township)}</td>
    <td>${fmtDate(startOf(o))}</td><td>${Math.floor((Date.now()-startOf(o))/3600000)} h</td>
    <td style="white-space:nowrap"><button class="btn btn-sm btn-primary" data-call-ok="${o.id}">Client confirmed</button> <button class="btn btn-sm btn-ghost" data-call-drop="${o.id}">Couldn't close — proceed</button></td></tr>`).join(""):`<tr><td colspan="7" class="muted">No unconfirmed deliveries. </td></tr>`}
  </tbody></table></div>`;
};
window.afterRenderCallClients = function(){
  const get = id=>state.orders.find(x=>x.id===id), by = state.currentUser.name;
  document.querySelectorAll("[data-call-ok]").forEach(b=>b.addEventListener("click",()=>{
    const o = get(b.dataset.callOk), t = prompt("Who did you speak to? (optional note)")
    if(t===null) return;
    o.customerConfirmedAt = Date.now(); o.confirmCall = { at:Date.now(), by, outcome:"confirmed", note:t.trim() };
    toast("Ticket "+o.id+" closed — client confirmed."); render(); }));
  document.querySelectorAll("[data-call-drop]").forEach(b=>b.addEventListener("click",()=>{
    const o = get(b.dataset.callDrop), t = prompt("Why couldn't it be closed? (e.g. no answer after 3 tries)"); if(!t||!t.trim()) return;
    o.confirmDropped = true; o.confirmCall = { at:Date.now(), by, outcome:"not_closed", note:t.trim() };
    toast("Ticket "+o.id+" moves on and is removed from the client's list."); render(); }));
};
})();
