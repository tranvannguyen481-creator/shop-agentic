/**
 * POST /api/upload/images
 * Body: multipart/form-data   field name: "images"   (up to MAX_FILES files)
 *
 * Returns an array of public URLs for accessing the uploaded images.
 */
const uploadImages = (req, res) => {
  const files = req.files; // populated by handleUpload middleware

  if (!files || files.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No images were uploaded." });
  }

  const baseUrl =
    process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

  const urls = files.map((file) => `${baseUrl}/images/${file.filename}`);

  return res.status(201).json({
    success: true,
    count: urls.length,
    urls,
  });
};

module.exports = { uploadImages };
