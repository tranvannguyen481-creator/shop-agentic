import { z } from "zod";

export const createEventSchema = z.object({
  mode: z.string().min(1, "Mode is required"),
  groupId: z.string().min(1, "Group is required"),
  uploadExcel: z.any().nullable(),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  pickupLocation: z.string().trim().min(1, "Pick-up location is required"),
  closingDate: z.string().min(1, "Closing date is required"),
  collectionDate: z.string().min(1, "Collection date is required"),
  collectionTime: z.string().min(1, "Collection time is required"),
  paymentAfterClosing: z.boolean(),
  payTogether: z.boolean(),
  adminFee: z.string(),
  addImportantNotes: z.boolean(),
  importantNotes: z.array(z.string()),
  addExternalUrl: z.boolean(),
  externalUrlFieldName: z.string(),
  externalUrl: z.string(),
  addDeliveryOptions: z.boolean(),
  deliveryScheduleDate: z.string(),
  deliveryTimeFrom: z.string(),
  deliveryTimeTo: z.string(),
  deliveryFees: z.array(
    z.object({
      name: z.string(),
      fee: z.string(),
    }),
  ),
  requestDeliveryDetails: z.boolean(),
});
