import * as testController from "@/features/test/controllers/test.controller";
import { Router } from "express";

const router = Router();

// GET /api/v1/test/images?page=1&limit=4
router.get("/images", testController.getImages);

export default router;
