import {
  addGroupMemberBodySchema,
  createGroupBodySchema,
  groupIdParamsSchema,
  inviteCodeParamsSchema,
  listGroupsQuerySchema,
  updateGroupSettingsBodySchema,
} from "@/features/group/dtos/group.dto";
import * as groupService from "@/features/group/services/group.service";
import { AppError } from "@/shared/exceptions/AppError";
import type { Request, Response } from "express";

export async function listMyGroups(
  req: Request,
  res: Response,
): Promise<Response> {
  const { page, pageSize } = listGroupsQuerySchema.parse(req.query ?? {});
  if (!req.user) throw AppError.unauthorized();
  const result = await groupService.listMyGroups(req.user, { page, pageSize });
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function createGroup(
  req: Request,
  res: Response,
): Promise<Response> {
  const payload = createGroupBodySchema.parse(req.body ?? {});
  if (!req.user) throw AppError.unauthorized();
  const result = await groupService.createGroup(payload, req.user);
  return res
    .status(201)
    .json({ success: true, data: result, message: "Success" });
}

export async function getGroupByCode(
  req: Request,
  res: Response,
): Promise<Response> {
  const { inviteCode } = inviteCodeParamsSchema.parse(req.params ?? {});
  if (!req.user) throw AppError.unauthorized();
  const result = await groupService.getGroupByCode(inviteCode, req.user);
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function updateGroupSettings(
  req: Request,
  res: Response,
): Promise<Response> {
  const { groupId } = groupIdParamsSchema.parse(req.params ?? {});
  const payload = updateGroupSettingsBodySchema.parse(req.body ?? {});
  if (!req.user) throw AppError.unauthorized();
  const result = await groupService.updateGroupSettings(
    groupId,
    payload,
    req.user,
  );
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function addMember(
  req: Request,
  res: Response,
): Promise<Response> {
  const { groupId } = groupIdParamsSchema.parse(req.params ?? {});
  const payload = addGroupMemberBodySchema.parse(req.body ?? {});
  if (!req.user) throw AppError.unauthorized();
  const result = await groupService.addGroupMember(groupId, payload, req.user);
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function getShareLink(
  req: Request,
  res: Response,
): Promise<Response> {
  const { groupId } = groupIdParamsSchema.parse(req.params ?? {});
  if (!req.user) throw AppError.unauthorized();
  const result = await groupService.getGroupShareLink(groupId, req.user);
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function resetInviteCode(
  req: Request,
  res: Response,
): Promise<Response> {
  const { groupId } = groupIdParamsSchema.parse(req.params ?? {});
  if (!req.user) throw AppError.unauthorized();
  const result = await groupService.resetGroupInviteCode(groupId, req.user);
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}

export async function getGroupDetail(
  req: Request,
  res: Response,
): Promise<Response> {
  const { groupId } = groupIdParamsSchema.parse(req.params ?? {});
  if (!req.user) throw AppError.unauthorized();
  const result = await groupService.getGroupDetail(groupId, req.user);
  return res
    .status(200)
    .json({ success: true, data: result, message: "Success" });
}
