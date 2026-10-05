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
   6. Paste that URL below as WEB_APP_URL. Reload index.html.

   Until WEB_APP_URL is filled in, the app runs on local, in-memory demo
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
  // Paste your deployed Apps Script Web App URL here, e.g.:
  // "https://script.google.com/macros/s/AKfycbx.../exec"
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbxKUSANMSoACaOodZLLZVSsa7DttUIvS9Ikqh0T-lo3x8JeHxVz5qD5hg4iMQsJ_z1S/exec",

  loaded: false,   // true once loadAll() succeeded; saves are blocked until then so a failed load can never overwrite the Sheet
  _timer: null,
  _lastPayloadJSON: null,

  enabled(){ return !!this.WEB_APP_URL; },

  /* Loads every tab in one round trip. Returns null if not configured or
     if the request fails, so callers can fall back to demo data. */
  async loadAll(){
    if(!this.enabled()) return null;
    try{
      const res = await fetch(this.WEB_APP_URL + "?action=loadAll", { method:"GET" });
      if(!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if(data && data.ok){ this.loaded = true; return data.data; }
      throw new Error((data && data.error) || "unknown error");
    }catch(err){
      console.warn("CGS Sheets: could not load from Google Sheets, starting from local demo data.", err);
      return null;
    }
  },

  /* Debounced full-state save — call on every render() rather than on
     every individual mutation. Waits for things to settle for a moment
     so a burst of clicks becomes one write instead of dozens. */
  scheduleSave(getPayloadFn){
    if(!this.enabled() || !this.loaded) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(()=>{
      const payload = getPayloadFn();
      const json = JSON.stringify(payload);
      if(json === this._lastPayloadJSON) return; // nothing changed, skip the write
      this._lastPayloadJSON = json;
      this._post({ action:"saveAll", data: payload });
    }, 1200);
  },

  /* Save right now (used when seeding the very first accounts). */
  async saveNow(getPayloadFn){
    if(!this.enabled() || !this.loaded) return;
    clearTimeout(this._timer);
    const payload = getPayloadFn();
    this._lastPayloadJSON = JSON.stringify(payload);
    await this._post({ action:"saveAll", data: payload });
  },

  /* Fire-and-forget POST. Uses text/plain to avoid triggering a CORS
     preflight (Apps Script Web Apps don't handle OPTIONS requests). */
  async _post(body){
    try{
      await fetch(this.WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body)
      });
    }catch(err){
      console.warn("CGS Sheets: save failed (will retry on next change).", err);
    }
  },

  /* Uploads one image file to Google Drive via the Apps Script backend.
     The image is shrunk in the browser first (max 900px, JPEG) so uploads
     are fast and Drive doesn't fill up with 8 MB phone photos.
     Resolves to { fileId, url, viewUrl }:
       url     -> direct, embeddable link (use this as <img src>)
       viewUrl -> the normal Drive "open file" link (stored in the Sheet)   */
  async uploadImage(file){
    if(!this.enabled()) throw new Error("Connect Google Sheets first (add WEB_APP_URL in sheets-api.js).");
    if(!file || !/^image\//.test(file.type)) throw new Error("Please choose an image file.");
    const { base64, mimeType } = await this._compressImage(file);
    const res = await fetch(this.WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "uploadImage",
        fileName: file.name.replace(/\.[^.]+$/, "") + ".jpg",
        mimeType, data: base64
      })
    });
    if(!res.ok) throw new Error("HTTP " + res.status);
    const out = await res.json();
    if(!out || !out.ok) throw new Error((out && out.error) || "Upload failed");
    return out;
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

  /* Generic request that expects { ok:true, ... } back. */
  async _request(body){
    if(!this.enabled()) throw new Error("Connect Google Sheets first (add WEB_APP_URL in sheets-api.js).");
    let res;
    try{
      res = await fetch(this.WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body)
      });
    }catch(err){ throw new Error("Can't reach Google Sheets. Check your connection and try again."); }
    if(!res.ok) throw new Error("Google Sheets returned HTTP " + res.status + ".");
    const out = await res.json();
    if(!out || !out.ok) throw new Error((out && out.error) || "Request failed");
    return out;
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
    this._post({ action:"checkReleases" });
  }
};
