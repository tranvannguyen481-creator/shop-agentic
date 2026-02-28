import { CreateItemsFormValues } from "../types/create-items-types";
import { createDefaultItem } from "../utils/create-items-utils";

export const MAX_BANNER_PHOTOS = 5;
export const CREATE_ITEMS_DRAFT_STORAGE_KEY = "shop-agentic:create-items-draft";

export const CREATE_ITEMS_DEFAULT_VALUES: CreateItemsFormValues = {
  items: [createDefaultItem()],
};
