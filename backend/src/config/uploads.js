const path = require("path");

const UPLOADS_ROUTE = "/uploads";
const PROFILE_UPLOAD_ROUTE = "/profile";
const UPLOADS_DIR = path.join(__dirname, "../uploads");
const PROFILE_UPLOADS_DIR = path.join(UPLOADS_DIR, "profile");

module.exports = {
  PROFILE_UPLOAD_ROUTE,
  PROFILE_UPLOADS_DIR,
  UPLOADS_DIR,
  UPLOADS_ROUTE,
};
