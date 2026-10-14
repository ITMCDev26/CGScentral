/* CGS Central — settings that change between environments.
   WEB_APP_URL is the Google Apps Script Web App address (it ends in /exec).
   On Vercel you can leave this as it is and set an environment variable called
   CGS_WEB_APP_URL instead — see README.md. Leave it empty to run on local demo data. */
window.CGS_CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbw73iWGWD7Syl-Y-RFS6Omwv1or0exVW4_DQLX_0NgNEhHtQ8T43RVXebW8G4u1-Ojb/exec",
  /* Shown on Approver 2's tick box. The e-mail itself is sent by the Apps Script, which holds the real address. */
  ESTATE_HEAD_EMAIL: "mcgenrevegar@gmail.com"
};
