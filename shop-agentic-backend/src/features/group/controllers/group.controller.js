const {
  addGroupMemberBodySchema,
  createGroupBodySchema,
  groupIdParamsSchema,
  inviteCodeParamsSchema,
  listGroupsQuerySchema,
  updateGroupSettingsBodySchema,
} = require("../dtos/group.dto");
const groupService = require("../services/group.service");

async function listMyGroups(req, res) {
  const { page, pageSize } = listGroupsQuerySchema.parse(req.query || {});
  const result = await groupService.listMyGroups(req.user, { page, pageSize });

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function createGroup(req, res) {
  const payload = createGroupBodySchema.parse(req.body || {});
  const result = await groupService.createGroup(payload, req.user);

  return res.status(201).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function getGroupByCode(req, res) {
  const { inviteCode } = inviteCodeParamsSchema.parse(req.params || {});
  const result = await groupService.getGroupByCode(inviteCode, req.user);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function updateGroupSettings(req, res) {
  const { groupId } = groupIdParamsSchema.parse(req.params || {});
  const payload = updateGroupSettingsBodySchema.parse(req.body || {});
  const result = await groupService.updateGroupSettings(
    groupId,
    payload,
    req.user,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function addMember(req, res) {
  const { groupId } = groupIdParamsSchema.parse(req.params || {});
  const payload = addGroupMemberBodySchema.parse(req.body || {});
  const result = await groupService.addGroupMember(groupId, payload, req.user);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function getShareLink(req, res) {
  const { groupId } = groupIdParamsSchema.parse(req.params || {});
  const result = await groupService.getGroupShareLink(groupId, req.user);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function resetInviteCode(req, res) {
  const { groupId } = groupIdParamsSchema.parse(req.params || {});
  const result = await groupService.resetGroupInviteCode(groupId, req.user);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function getGroupDetail(req, res) {
  const { groupId } = groupIdParamsSchema.parse(req.params || {});
  const result = await groupService.getGroupDetail(groupId, req.user);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

module.exports = {
  listMyGroups,
  getGroupByCode,
  createGroup,
  updateGroupSettings,
  addMember,
  getShareLink,
  resetInviteCode,
  getGroupDetail,
};
