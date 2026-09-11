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
  WEB_APP_URL: "",

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
      if(data && data.ok) return data.data;
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
    if(!this.enabled()) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(()=>{
      const payload = getPayloadFn();
      const json = JSON.stringify(payload);
      if(json === this._lastPayloadJSON) return; // nothing changed, skip the write
      this._lastPayloadJSON = json;
      this._post({ action:"saveAll", data: payload });
    }, 1200);
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

  /* Ask the backend to run its release check immediately (in addition to
     the daily time-driven trigger in Code.gs), useful right after an
     admin sets/changes an ETA date. Best-effort — the client already
     runs the same check locally so the UI is correct either way. */
  pokeReleaseCheck(){
    if(!this.enabled()) return;
    this._post({ action:"checkReleases" });
  }
};
