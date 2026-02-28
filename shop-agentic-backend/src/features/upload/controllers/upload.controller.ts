import type { Request, Response } from "express";

/**
 * POST /api/v1/upload/images
 * Body: multipart/form-data   field: "images"   (up to MAX_FILES files)
 *
 * Returns an array of public URLs for accessing the uploaded images.
 */
export function uploadImages(req: Request, res: Response): Response {
  // req.files is populated by handleUpload (multer) middleware
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No images were uploaded." });
  }

  const baseUrl =
    process.env["BASE_URL"] ?? `${req.protocol}://${req.get("host")}`;
  const urls = files.map((file) => `${baseUrl}/images/${file.filename}`);

  return res.status(201).json({ success: true, count: urls.length, urls });
}
