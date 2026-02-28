const express = require("express");
const eventController = require("../controllers/event.controller");
const authMiddleware = require("../../../shared/middleware/auth");

const router = express.Router();

router.get("/", eventController.listEvents);
router.get("/my-hosted", authMiddleware, eventController.listMyHostedEvents);
router.post("/", authMiddleware, eventController.createEvent);
router.post("/:eventId/join", eventController.joinEvent);
router.get("/:eventId/edit-draft", eventController.getEventEditDraft);
router.get("/:eventId/manage-orders", eventController.getManageOrdersData);
router.get("/:eventId/detail", authMiddleware, eventController.getEventDetail);

module.exports = router;
