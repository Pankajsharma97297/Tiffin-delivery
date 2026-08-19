const express = require("express");
const fs = require("fs");
const multer = require("multer");

const { uploadProfileImage } = require("../controllers/uploadController");
const { PROFILE_UPLOADS_DIR } = require("../config/uploads");

const router = express.Router();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    fs.mkdirSync(PROFILE_UPLOADS_DIR, { recursive: true });
    callback(null, PROFILE_UPLOADS_DIR);
  },
  filename: (_req, file, callback) => {
    const safeName = String(file.originalname || "profile-image")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9_-]/gi, "-")
      .slice(0, 40);
    const extension =
      file.mimetype === "image/png"
        ? "png"
        : file.mimetype === "image/webp"
          ? "webp"
          : "jpg";

    callback(null, `${safeName || "profile"}-${Date.now()}.${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Only JPEG, PNG and WEBP images are allowed"));
      return;
    }

    callback(null, true);
  },
});

router.post("/profile-image", upload.single("image"), uploadProfileImage);

module.exports = router;
