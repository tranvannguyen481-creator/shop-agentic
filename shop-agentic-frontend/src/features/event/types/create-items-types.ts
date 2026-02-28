import { FieldArrayWithId, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { UseSmartFormReturn } from "../../../shared/components/form/use-smart-form";
import { createItemsSchema } from "../schemas/create-items-schema";

export type CreateItemsFormValues = z.infer<typeof createItemsSchema>;
export type ItemFormValue = CreateItemsFormValues["items"][number];
export type ItemOptionFormValue = ItemFormValue["options"][number];

export interface CreateItemsPageViewModel {
  form: UseSmartFormReturn<CreateItemsFormValues>;
  itemFields: FieldArrayWithId<CreateItemsFormValues, "items", "id">[];
  bannerPreviewUrls: string[];
  bannerPhotosLeft: number;
  handleSubmit: SubmitHandler<CreateItemsFormValues>;
  handleBannerFilesChange: (files: FileList | null) => void;
  handleRemoveBannerPhoto: (previewUrlToRemove: string) => void;
  handleItemFilesChange: (itemIndex: number, files: FileList | null) => void;
  handleRemoveItemPhoto: (itemIndex: number) => void;
  handleSwapItemUp: (itemIndex: number) => void;
  handleSwapItemDown: (itemIndex: number) => void;
  handleDuplicateItem: (itemIndex: number) => void;
  handleRemoveItem: (itemIndex: number) => void;
  handleAddItem: () => void;
  handleAddOption: (itemIndex: number) => void;
  handleRemoveOption: (itemIndex: number, optionIndex: number) => void;
  getItemPreviewUrl: (itemIndex: number) => string | null;
  getItemOptions: (itemIndex: number) => ItemOptionFormValue[];
}
