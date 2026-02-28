import * as groupController from "@/features/group/controllers/group.controller";
import authMiddleware from "@/shared/middleware/auth";
import { Router } from "express";

const router = Router();

router.use(authMiddleware);
router.get("/my", groupController.listMyGroups);
router.get("/code/:inviteCode", groupController.getGroupByCode);
router.post("/", groupController.createGroup);
router.patch("/:groupId/settings", groupController.updateGroupSettings);
router.patch("/:groupId/reset-code", groupController.resetInviteCode);
router.post("/:groupId/members", groupController.addMember);
router.get("/:groupId/share-link", groupController.getShareLink);
router.get("/:groupId", groupController.getGroupDetail);

export default router;
