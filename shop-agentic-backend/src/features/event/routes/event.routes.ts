import * as eventController from "@/features/event/controllers/event.controller";
import authMiddleware from "@/shared/middleware/auth";
import { Router } from "express";

const router = Router();

router.get("/", eventController.listEvents);
router.get("/my-feed", authMiddleware, eventController.listGroupEvents);
router.get("/my-hosted", authMiddleware, eventController.listMyHostedEvents);
router.post("/", authMiddleware, eventController.createEvent);
router.post("/:eventId/join", eventController.joinEvent);
router.get("/:eventId/edit-draft", eventController.getEventEditDraft);
router.get("/:eventId/manage-orders", eventController.getManageOrdersData);
router.get("/:eventId/detail", authMiddleware, eventController.getEventDetail);
router.post("/:eventId/re-host", authMiddleware, eventController.reHostEvent);

export default router;
