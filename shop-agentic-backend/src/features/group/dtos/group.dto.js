const { z } = require("zod");
const { GROUP_STATUS } = require("../types/group.types");

const listGroupsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const groupIdParamsSchema = z.object({
  groupId: z.string().min(1, "groupId is required"),
});

const inviteCodeParamsSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(1, "inviteCode is required")
    .transform((value) => value.toUpperCase()),
});

const createGroupBodySchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(120),
  description: z.string().trim().max(500).optional().default(""),
});

const updateGroupSettingsBodySchema = z.object({
  status: z.enum([GROUP_STATUS.ACTIVE, GROUP_STATUS.PAUSED]),
});

const addGroupMemberBodySchema = z.object({
  email: z.string().trim().email("Valid member email is required"),
});

module.exports = {
  listGroupsQuerySchema,
  groupIdParamsSchema,
  inviteCodeParamsSchema,
  createGroupBodySchema,
  updateGroupSettingsBodySchema,
  addGroupMemberBodySchema,
};
