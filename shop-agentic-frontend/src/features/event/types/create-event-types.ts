import { z } from "zod";
import { createEventSchema } from "../schemas/create-event-schema";

export type CreateEventFormValues = z.infer<typeof createEventSchema>;

export interface ExternalUrlPayload {
  fieldName: string;
  url: string;
}

export interface DeliveryFeePayload {
  name: string;
  fee: string;
}

export interface DeliveryOptionsPayload {
  date: string;
  fromTime: string;
  toTime: string;
  fees: DeliveryFeePayload[];
}
