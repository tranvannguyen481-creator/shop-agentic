import * as testService from "@/features/test/services/test.service";
import type { Request, Response } from "express";

export async function getImages(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query["page"] ?? "1"), 10) || 1);
  const limit = Math.min(
    20,
    Math.max(1, parseInt(String(req.query["limit"] ?? "4"), 10) || 4),
  );

  const data = await testService.getImages({ page, limit });

  res.json({ success: true, data, message: "Images fetched successfully" });
}
