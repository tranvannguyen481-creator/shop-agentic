const path = require("path");
const multer = require("multer");

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE_MB = parseInt(
  process.env.UPLOAD_MAX_FILE_SIZE_MB || "5",
  10,
);
const MAX_FILES = parseInt(process.env.UPLOAD_MAX_FILES || "10", 10);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "../../../public/images"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(
      `Unsupported file type "${file.mimetype}". Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
    );
    err.statusCode = 400;
    cb(err, false);
  }
};

/** Upload up to MAX_FILES images under the field name "images" */
const uploadImages = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_FILES,
  },
  fileFilter,
}).array("images", MAX_FILES);

/**
 * Express-compatible wrapper that converts Multer errors into proper HTTP errors.
 * Usage:  router.post("/", handleUpload, controller)
 */
const handleUpload = (req, res, next) => {
  uploadImages(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      const messages = {
        LIMIT_FILE_SIZE: `Each file must be ≤ ${MAX_FILE_SIZE_MB} MB.`,
        LIMIT_FILE_COUNT: `You can upload at most ${MAX_FILES} files at once.`,
        LIMIT_UNEXPECTED_FILE: 'Use the field name "images" for file uploads.',
      };
      const message = messages[err.code] || err.message;
      return res.status(status).json({ success: false, message });
    }

    // Custom errors from fileFilter
    err.statusCode = err.statusCode || 400;
    next(err);
  });
};

module.exports = { handleUpload };
