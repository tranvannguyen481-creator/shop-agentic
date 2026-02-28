import { uploadImages } from "@/features/upload/controllers/upload.controller";
import authMiddleware from "@/shared/middleware/auth";
import { handleUpload } from "@/shared/middleware/upload";
import { Router } from "express";

const router = Router();

/**
 * POST /api/v1/upload/images
 * Auth required. Upload 1–10 images (field: "images").
 * Returns: { success, count, urls[] }
 */
router.post("/images", authMiddleware, handleUpload, uploadImages);

export default router;
