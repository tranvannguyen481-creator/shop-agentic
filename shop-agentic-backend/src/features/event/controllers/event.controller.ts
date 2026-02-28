import {
  createEventBodySchema,
  eventIdParamsSchema,
  listEventsQuerySchema,
} from "@/features/event/dtos/event.dto";
import * as eventService from "@/features/event/services/event.service";
import { AppError } from "@/shared/exceptions/AppError";
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
  const result = await eventService.getEventDetail(eventId, actor);

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

  return res
    .status(201)
    .json({
      success: true,
      data: result,
      message: "New event created from re-host",
    });
}
