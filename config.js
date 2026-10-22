/* CGS Central — settings that change between environments.
   WEB_APP_URL is the Google Apps Script Web App address (it ends in /exec).
   On Vercel you can leave this as it is and set an environment variable called
   CGS_WEB_APP_URL instead — see README.md. Leave it empty to run on local demo data. */
window.CGS_CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbwykVUAjRap2HwvaDyc9VhV9zaYGY5JiM2CsEyimUBp8gV6wDJL2NLFMS0zXwkytr7u/exec",
  /* Shown on Approver 2's tick box. The e-mail itself is sent by the Apps Script, which holds the real address. */
  ESTATE_HEAD_EMAIL: "mcgenrevegar@gmail.com"
};
