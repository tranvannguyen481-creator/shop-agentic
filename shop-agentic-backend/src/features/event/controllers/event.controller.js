const {
  createEventBodySchema,
  eventIdParamsSchema,
  listEventsQuerySchema,
} = require("../dtos/event.dto");
const eventService = require("../services/event.service");

async function listEvents(req, res) {
  const { page, pageSize } = listEventsQuerySchema.parse(req.query || {});
  const result = await eventService.listEvents({ page, pageSize });

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function createEvent(req, res) {
  const body = createEventBodySchema.parse(req.body || {});
  const actor = req.user;

  if (!actor?.uid) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const result = await eventService.createEvent(body || {}, actor);

  return res.status(201).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function listGroupEvents(req, res) {
  const { page, pageSize } = listEventsQuerySchema.parse(req.query || {});
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const actor = req.user;
  const result = await eventService.listGroupEvents(actor, {
    page,
    pageSize,
    search,
  });

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function listMyHostedEvents(req, res) {
  const { page, pageSize } = listEventsQuerySchema.parse(req.query || {});
  const actor = req.user || null;
  const result = await eventService.listHostedEvents(actor, {
    page,
    pageSize,
  });

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function joinEvent(req, res) {
  const { eventId } = eventIdParamsSchema.parse(req.params || {});
  const user = req.user || {
    uid: req.body?.uid || "anonymous",
  };

  await eventService.joinEvent(eventId, user);

  return res.status(200).json({
    success: true,
    data: null,
    message: "Success",
  });
}

async function getEventEditDraft(req, res) {
  const { eventId } = eventIdParamsSchema.parse(req.params || {});
  const result = await eventService.getEventEditDraft(eventId);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function getManageOrdersData(req, res) {
  const { eventId } = eventIdParamsSchema.parse(req.params || {});
  const result = await eventService.getManageOrdersData(eventId);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function getEventDetail(req, res) {
  const { eventId } = eventIdParamsSchema.parse(req.params || {});
  const actor = req.user || null;
  const result = await eventService.getEventDetail(eventId, actor);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Success",
  });
}

async function reHostEvent(req, res) {
  const { eventId } = eventIdParamsSchema.parse(req.params || {});
  const actor = req.user;
  const result = await eventService.reHostEvent(eventId, actor);

  return res.status(201).json({
    success: true,
    data: result,
    message: "New event created from re-host",
  });
}

module.exports = {
  listEvents,
  listGroupEvents,
  createEvent,
  listMyHostedEvents,
  joinEvent,
  getEventEditDraft,
  getManageOrdersData,
  getEventDetail,
  reHostEvent,
};
