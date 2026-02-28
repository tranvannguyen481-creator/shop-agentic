import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE_MB = parseInt(
  process.env.UPLOAD_MAX_FILE_SIZE_MB ?? "5",
  10,
);
const MAX_FILES = parseInt(process.env.UPLOAD_MAX_FILES ?? "10", 10);

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

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(
      `Unsupported file type "${file.mimetype}". Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
    ) as Error & { statusCode?: number };
    err.statusCode = 400;
    cb(err);
  }
};

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
 */
export const handleUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  uploadImages(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      const messages: Record<string, string> = {
        LIMIT_FILE_SIZE: `Each file must be ≤ ${MAX_FILE_SIZE_MB} MB.`,
        LIMIT_FILE_COUNT: `You can upload at most ${MAX_FILES} files at once.`,
        LIMIT_UNEXPECTED_FILE: 'Use the field name "images" for file uploads.',
      };
      const message = messages[err.code] ?? err.message;
      res.status(status).json({ success: false, message });
      return;
    }

    // Custom errors from fileFilter
    (err as Error & { statusCode?: number }).statusCode =
      (err as Error & { statusCode?: number }).statusCode ?? 400;
    next(err);
  });
};
