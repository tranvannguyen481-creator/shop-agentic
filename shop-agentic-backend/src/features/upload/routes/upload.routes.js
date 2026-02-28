const express = require("express");
const authMiddleware = require("../../../shared/middleware/auth");
const { handleUpload } = require("../../../shared/middleware/upload");
const uploadController = require("../controllers/upload.controller");

const router = express.Router();

/**
 * POST /api/upload/images
 * Auth required. Upload 1–10 images (field: "images").
 * Returns: { success, count, urls[] }
 */
router.post(
  "/images",
  authMiddleware,
  handleUpload,
  uploadController.uploadImages,
);

module.exports = router;
