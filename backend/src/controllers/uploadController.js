const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { PROFILE_UPLOAD_ROUTE } = require("../config/uploads");

const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file?.filename) {
    return res.status(400).json({
      success: false,
      message: "Valid image file is required",
    });
  }

  return sendSuccess(res, 201, "Profile image uploaded", {
    url: `${PROFILE_UPLOAD_ROUTE}/${req.file.filename}`,
  });
});

module.exports = {
  uploadProfileImage,
};
