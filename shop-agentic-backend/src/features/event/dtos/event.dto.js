const { z } = require("zod");

const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const eventIdParamsSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
});

const createEventBodySchema = z
  .object({
    groupId: z.string().trim().optional(),
    createEventDraft: z.record(z.string(), z.unknown()).optional(),
    createItemsDraft: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()
  .superRefine((payload, context) => {
    const directGroupId =
      typeof payload.groupId === "string" ? payload.groupId.trim() : "";

    const draftGroupId =
      payload.createEventDraft && typeof payload.createEventDraft === "object"
        ? typeof payload.createEventDraft.groupId === "string"
          ? payload.createEventDraft.groupId.trim()
          : ""
        : "";

    if (!directGroupId && !draftGroupId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "groupId is required when creating event",
        path: ["createEventDraft", "groupId"],
      });
    }
  });

module.exports = {
  listEventsQuerySchema,
  eventIdParamsSchema,
  createEventBodySchema,
};
