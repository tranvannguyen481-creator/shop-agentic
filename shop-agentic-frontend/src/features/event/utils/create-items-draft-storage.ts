import { CREATE_ITEMS_DRAFT_STORAGE_KEY } from "../constants/create-items-constants";
import { CreateItemsFormValues } from "../types/create-items-types";
import { createDefaultItem } from "./create-items-utils";

interface CreateItemsDraftPayload {
  items: CreateItemsFormValues["items"];
  bannerPreviewUrls: string[];
}

export interface CreateItemsDraftState {
  formValues: Partial<CreateItemsFormValues>;
  bannerPreviewUrls: string[];
}

const EMPTY_DRAFT: CreateItemsDraftState = {
  formValues: {},
  bannerPreviewUrls: [],
};

export const toPersistedDraft = (
  values: CreateItemsFormValues,
  bannerPreviewUrls: string[],
): CreateItemsDraftPayload => ({
  items: values.items.map((item) => ({
    ...item,
    imageFile: null,
    imagePreviewUrl: item.imagePreviewUrl ?? null,
    options: item.options.map((option) => ({
      value: option.value ?? "",
    })),
    optionGroups: Array.isArray(item.optionGroups)
      ? item.optionGroups.map((group) => ({
          ...group,
          choices: Array.isArray(group.choices) ? group.choices : [],
        }))
      : [],
  })),
  bannerPreviewUrls,
});

export const getStoredCreateItemsDraft = (): CreateItemsDraftState => {
  if (typeof window === "undefined") {
    return EMPTY_DRAFT;
  }

  try {
    const rawDraft = window.localStorage.getItem(
      CREATE_ITEMS_DRAFT_STORAGE_KEY,
    );

    if (!rawDraft) {
      return EMPTY_DRAFT;
    }

    const parsedDraft = JSON.parse(
      rawDraft,
    ) as Partial<CreateItemsDraftPayload>;
    const parsedItems = parsedDraft.items;
    const parsedBannerPreviewUrls = Array.isArray(parsedDraft.bannerPreviewUrls)
      ? parsedDraft.bannerPreviewUrls.filter(
          (url): url is string => typeof url === "string",
        )
      : [];

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return { formValues: {}, bannerPreviewUrls: parsedBannerPreviewUrls };
    }

    return {
      formValues: {
        items: parsedItems.map((item) => ({
          ...createDefaultItem(),
          ...item,
          imageFile: null,
          imagePreviewUrl:
            typeof item.imagePreviewUrl === "string"
              ? item.imagePreviewUrl
              : null,
          options: Array.isArray(item.options)
            ? item.options.map((option) => ({ value: option?.value ?? "" }))
            : [],
          optionGroups: Array.isArray(item.optionGroups)
            ? item.optionGroups.map((group) => ({
                name: group?.name ?? "",
                required: Boolean(group?.required),
                choices: Array.isArray(group?.choices)
                  ? group.choices.map((c) => ({
                      id: c?.id ?? "",
                      name: c?.name ?? "",
                      price: Number(c?.price ?? 0),
                    }))
                  : [],
              }))
            : [],
        })),
      },
      bannerPreviewUrls: parsedBannerPreviewUrls,
    };
  } catch {
    return EMPTY_DRAFT;
  }
};

export const saveCreateItemsDraft = (
  values: CreateItemsFormValues,
  bannerPreviewUrls: string[],
) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CREATE_ITEMS_DRAFT_STORAGE_KEY,
      JSON.stringify(toPersistedDraft(values, bannerPreviewUrls)),
    );
  } catch {

  }
};
