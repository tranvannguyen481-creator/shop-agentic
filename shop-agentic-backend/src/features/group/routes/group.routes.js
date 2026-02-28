const express = require("express");
const authMiddleware = require("../../../shared/middleware/auth");
const groupController = require("../controllers/group.controller");

const router = express.Router();

router.use(authMiddleware);
router.get("/my", groupController.listMyGroups);
router.get("/code/:inviteCode", groupController.getGroupByCode);
router.post("/", groupController.createGroup);
router.patch("/:groupId/settings", groupController.updateGroupSettings);
router.patch("/:groupId/reset-code", groupController.resetInviteCode);
router.post("/:groupId/members", groupController.addMember);
router.get("/:groupId/share-link", groupController.getShareLink);
router.get("/:groupId", groupController.getGroupDetail);

module.exports = router;
