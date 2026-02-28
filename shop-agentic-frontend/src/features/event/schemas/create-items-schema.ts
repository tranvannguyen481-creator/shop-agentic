import { z } from "zod";

export const createItemsSchema = z.object({
  items: z
    .array(
      z.object({
        imageFile: z.any().nullable(),
        imagePreviewUrl: z.string().nullable(),
        name: z.string().trim().min(1, "Item name is required"),
        description: z.string().optional().default(""),
        price: z.string().optional().default("0"),
        options: z.array(
          z.object({
            value: z.string().optional().default(""),
          }),
        ),
        optionGroups: z
          .array(
            z.object({
              name: z.string().optional().default(""),
              required: z.boolean().optional().default(false),
              choices: z.array(
                z.object({
                  id: z.string().optional().default(""),
                  name: z.string().optional().default(""),
                  price: z.number().optional().default(0),
                }),
              ),
            }),
          )
          .optional()
          .default([]),
      }),
    )
    .min(1),
});
