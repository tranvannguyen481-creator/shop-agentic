import {
  createEventBodySchema,
  eventIdParamsSchema,
  listEventsQuerySchema,
} from "@/features/event/dtos/event.dto";
import * as eventService from "@/features/event/services/event.service";
import { AppError } from "@/shared/exceptions/AppError";
import { decryptToken, encryptToken } from "@/shared/utils/crypto.utils";
import type { Request, Response } from "express";

export async function listEvents(
  req: Request,
  res: Response,
): Promise<Response> {
  const { page, pageSize } = listEventsQuerySchema.parse(req.query ?? {});
  const result = await eventService.listEvents({ page, pageSize });

  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function createEvent(
  req: Request,
  res: Response,
): Promise<Response> {
  const body = createEventBodySchema.parse(req.body ?? {});
  const actor = req.user;

  if (!actor?.uid) throw AppError.unauthorized();

  const result = await eventService.createEvent(body, actor);

  return res
    .status(201)
    .json({ success: true, data: result, message: "Success" });
}

export async function listGroupEvents(
  req: Request,
  res: Response,
): Promise<Response> {
  const { page, pageSize } = listEventsQuerySchema.parse(req.query ?? {});
  const search =
    typeof req.query["search"] === "string" ? req.query["search"] : "";
  const actor = req.user;

  if (!actor) throw AppError.unauthorized();

  const result = await eventService.listGroupEvents(actor, {
    page,
    pageSize,
    search,
  });

  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function listMyHostedEvents(
  req: Request,
  res: Response,
): Promise<Response> {
  const { page, pageSize } = listEventsQuerySchema.parse(req.query ?? {});
  const actor = req.user ?? null;
  const result = await eventService.listHostedEvents(actor, { page, pageSize });

  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function joinEvent(
  req: Request,
  res: Response,
): Promise<Response> {
  const { eventId } = eventIdParamsSchema.parse(req.params ?? {});
  const user = req.user ?? {
    uid:
      ((req.body as Record<string, unknown>)?.["uid"] as string) ?? "anonymous",
  };

  await eventService.joinEvent(eventId, user);

  return res
    .status(200)
    .json({ success: true, data: null, message: "Success" });
}

export async function getEventEditDraft(
  req: Request,
  res: Response,
): Promise<Response> {
  const { eventId } = eventIdParamsSchema.parse(req.params ?? {});
  const result = await eventService.getEventEditDraft(eventId);

  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function getManageOrdersData(
  req: Request,
  res: Response,
): Promise<Response> {
  const { eventId } = eventIdParamsSchema.parse(req.params ?? {});
  const result = await eventService.getManageOrdersData(eventId);

  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function getEventDetail(
  req: Request,
  res: Response,
): Promise<Response> {
  const { eventId } = eventIdParamsSchema.parse(req.params ?? {});
  const actor = req.user ?? null;

  // If a valid encrypted groupToken is provided, decrypt it so the service
  // can skip the group-membership check for invited users.
  let invitedGroupId: string | undefined;
  const rawGroupToken =
    typeof req.query["groupToken"] === "string"
      ? req.query["groupToken"].trim()
      : "";
  if (rawGroupToken) {
    try {
      invitedGroupId = decryptToken(rawGroupToken);
    } catch {
      // Invalid / tampered token — just ignore and fall through to normal
      // permission checks. We don't want to reveal decryption details.
    }
  }

  const result = await eventService.getEventDetail(
    eventId,
    actor,
    invitedGroupId,
  );

  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function reHostEvent(
  req: Request,
  res: Response,
): Promise<Response> {
  const { eventId } = eventIdParamsSchema.parse(req.params ?? {});
  const actor = req.user;

  if (!actor) throw AppError.unauthorized();

  const result = await eventService.reHostEvent(eventId, actor);

  return res.status(201).json({
    success: true,
    data: result,
    message: "New event created from re-host",
  });
}

/**
 * GET /events/:eventId/group-share-token
 *
 * Returns an AES-256-GCM encrypted, URL-safe token that encodes the
 * event's groupId.  Used to build secure share links.
 */
export async function getGroupShareToken(
  req: Request,
  res: Response,
): Promise<Response> {
  const { eventId } = eventIdParamsSchema.parse(req.params ?? {});
  const actor = req.user;
  if (!actor) throw AppError.unauthorized();

  const detail = await eventService.getEventDetail(eventId, actor);
  const groupId =
    typeof detail?.groupId === "string" ? detail.groupId.trim() : "";

  if (!groupId) {
    throw AppError.badRequest("This event is not associated with a group");
  }

  const token = encryptToken(groupId);

  return res
    .status(200)
    .json({ success: true, data: { token }, message: "Success" });
}

/**
 * GET /events/resolve-share-token?token=xxx
 *
 * Decrypts an encrypted share token back to the original groupId.
 * Returns the groupId so the frontend can associate the user with the group.
 */
export async function resolveShareToken(
  req: Request,
  res: Response,
): Promise<Response> {
  const actor = req.user;
  if (!actor) throw AppError.unauthorized();

  const rawToken =
    typeof req.query["token"] === "string" ? req.query["token"].trim() : "";

  if (!rawToken) {
    throw AppError.badRequest("token query parameter is required");
  }

  const groupId = decryptToken(rawToken);

  return res
    .status(200)
    .json({ success: true, data: { groupId }, message: "Success" });
}

/**
 * POST /events/:eventId/record-group-visit
 *
 * Records that the authenticated user visited the event via a group share
 * link.  Writes a deduplicated doc to `groupBuyActivity` so the host's
 * checkout page receives a real-time toast.
 */
export async function recordGroupVisit(
  req: Request,
  res: Response,
): Promise<Response> {
  const { eventId } = eventIdParamsSchema.parse(req.params ?? {});
  const actor = req.user;
  if (!actor) throw AppError.unauthorized();

  const result = await eventService.recordGroupVisit(eventId, actor);

  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}
