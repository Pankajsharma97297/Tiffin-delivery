const { PROFILE_UPLOAD_ROUTE, UPLOADS_ROUTE } = require("../config/uploads");

const toStoredAvatarPath = (value = "") => {
  const avatar = String(value || "").trim();

  if (!avatar) {
    return "";
  }

  const uploadsPattern = new RegExp(`${UPLOADS_ROUTE}${PROFILE_UPLOAD_ROUTE}/([^/?#]+)`);
  const uploadsMatch = avatar.match(uploadsPattern);
  if (uploadsMatch?.[1]) {
    return `${PROFILE_UPLOAD_ROUTE}/${uploadsMatch[1]}`;
  }

  const profilePattern = new RegExp(`${PROFILE_UPLOAD_ROUTE}/([^/?#]+)`);
  const profileMatch = avatar.match(profilePattern);
  if (profileMatch?.[1]) {
    return `${PROFILE_UPLOAD_ROUTE}/${profileMatch[1]}`;
  }

  return "";
};

module.exports = {
  toStoredAvatarPath,
};
