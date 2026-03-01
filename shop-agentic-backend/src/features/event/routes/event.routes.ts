import * as eventController from "@/features/event/controllers/event.controller";
import * as groupBuyController from "@/features/event/controllers/group-buy.controller";
import authMiddleware from "@/shared/middleware/auth";
import { Router } from "express";

const router = Router();

router.get("/", eventController.listEvents);
router.get("/my-feed", authMiddleware, eventController.listGroupEvents);
router.get("/my-hosted", authMiddleware, eventController.listMyHostedEvents);
router.get(
  "/resolve-share-token",
  authMiddleware,
  eventController.resolveShareToken,
);
router.post("/", authMiddleware, eventController.createEvent);
router.post("/:eventId/join", eventController.joinEvent);
router.post(
  "/:eventId/record-group-visit",
  authMiddleware,
  eventController.recordGroupVisit,
);
router.get("/:eventId/edit-draft", eventController.getEventEditDraft);
router.get("/:eventId/manage-orders", eventController.getManageOrdersData);
router.get("/:eventId/detail", authMiddleware, eventController.getEventDetail);
router.get(
  "/:eventId/group-share-token",
  authMiddleware,
  eventController.getGroupShareToken,
);
router.post("/:eventId/re-host", authMiddleware, eventController.reHostEvent);

// Group-buy session
router.post(
  "/:eventId/group-buy/join",
  authMiddleware,
  groupBuyController.joinGroupBuySession,
);
router.delete(
  "/:eventId/group-buy/dissolve",
  authMiddleware,
  groupBuyController.dissolveGroupBuySession,
);
router.delete(
  "/:eventId/group-buy/leave",
  authMiddleware,
  groupBuyController.leaveGroupBuySession,
);

export default router;
