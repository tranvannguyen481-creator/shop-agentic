import { GROUP_STATUS } from "@/features/group/types/group.types";
import { z } from "zod";

export const listGroupsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const groupIdParamsSchema = z.object({
  groupId: z.string().min(1, "groupId is required"),
});

export const inviteCodeParamsSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(1, "inviteCode is required")
    .transform((value) => value.toUpperCase()),
});

export const createGroupBodySchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(120),
  description: z.string().trim().max(500).optional().default(""),
});

export const updateGroupSettingsBodySchema = z.object({
  status: z.enum([GROUP_STATUS.ACTIVE, GROUP_STATUS.PAUSED]),
});

export const addGroupMemberBodySchema = z.object({
  email: z.string().trim().email("Valid member email is required"),
});

export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;
export type GroupIdParams = z.infer<typeof groupIdParamsSchema>;
export type InviteCodeParams = z.infer<typeof inviteCodeParamsSchema>;
export type CreateGroupBody = z.infer<typeof createGroupBodySchema>;
export type UpdateGroupSettingsBody = z.infer<
  typeof updateGroupSettingsBodySchema
>;
export type AddGroupMemberBody = z.infer<typeof addGroupMemberBodySchema>;
