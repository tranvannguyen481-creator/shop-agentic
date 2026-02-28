import { z } from "zod";

export const createEventDetailOrderSchema = (requiredGroupIds: string[]) =>
  z
    .object({
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
      requiredSelections: z.record(z.string(), z.string()).default({}),
    })
    .superRefine((values, context) => {
      requiredGroupIds.forEach((groupId) => {
        const selectedChoiceId = values.requiredSelections[groupId];

        if (!selectedChoiceId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please choose one option",
            path: ["requiredSelections", groupId],
          });
        }
      });
    });
