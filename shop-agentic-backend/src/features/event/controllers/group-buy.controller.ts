import * as groupBuySessionService from "@/features/event/services/group-buy-session.service";
import { AppError } from "@/shared/exceptions/AppError";
import type { Request, Response } from "express";
import { z } from "zod";

const eventIdParamsSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
});

/**
 * POST /events/:eventId/group-buy/join
 *
 * Called when a group member toggles "Mua nhóm" ON in checkout.
 * Creates or joins the active group-buy session for this event.
 */
export async function joinGroupBuySession(
  req: Request,
  res: Response,
): Promise<Response> {
  const { eventId } = eventIdParamsSchema.parse(req.params ?? {});
  if (!req.user) throw AppError.unauthorized();

  const result = await groupBuySessionService.joinGroupBuySession(
    eventId,
    req.user,
  );

  return res
    .status(200)
    .json({
      success: true,
      data: result,
      message: "Tham gia phiên mua nhóm thành công",
    });
}

/**
 * DELETE /events/:eventId/group-buy/dissolve
 *
 * Host-only: cancels the group-buy session, removes all participants,
 * and marks the session as dissolved (so real-time listeners can redirect members).
 */
export async function dissolveGroupBuySession(
  req: Request,
  res: Response,
): Promise<Response> {
  const { eventId } = eventIdParamsSchema.parse(req.params ?? {});
  if (!req.user) throw AppError.unauthorized();

  const result = await groupBuySessionService.dissolveGroupBuySession(
    eventId,
    req.user,
  );

  return res
    .status(200)
    .json({
      success: true,
      data: result,
      message: "Đã giải tán phiên mua nhóm",
    });
}

/**
 * DELETE /events/:eventId/group-buy/leave
 *
 * Non-host members only: leave the group-buy session.
 */
export async function leaveGroupBuySession(
  req: Request,
  res: Response,
): Promise<Response> {
  const { eventId } = eventIdParamsSchema.parse(req.params ?? {});
  if (!req.user) throw AppError.unauthorized();

  const result = await groupBuySessionService.leaveGroupBuySession(
    eventId,
    req.user,
  );

  return res
    .status(200)
    .json({ success: true, data: result, message: "Đã rời phiên mua nhóm" });
}
