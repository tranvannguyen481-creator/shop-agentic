import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { useSmartForm } from "../../../shared/components/form";
import {
  CREATE_ITEMS_DEFAULT_VALUES,
  MAX_BANNER_PHOTOS,
} from "../constants/create-items-constants";
import { createItemsSchema } from "../schemas/create-items-schema";
import {
  CreateItemsFormValues,
  CreateItemsPageViewModel,
  ItemOptionFormValue,
} from "../types/create-items-types";
import {
  readFileAsDataUrl,
  revokeBlobPreviewUrl,
} from "../utils/blob-url-utils";
import {
  getStoredCreateItemsDraft,
  saveCreateItemsDraft,
} from "../utils/create-items-draft-storage";
import { createDefaultItem } from "../utils/create-items-utils";
import { useCreateItemsSubmit } from "./use-create-items-submit";

export const useCreateItemsPage = (): CreateItemsPageViewModel => {
  const navigateToNextStep = useCreateItemsSubmit();
  const initialDraftState = useMemo(getStoredCreateItemsDraft, []);

  const form = useSmartForm<CreateItemsFormValues>({
    schema: createItemsSchema,
    defaultValues: {
      ...CREATE_ITEMS_DEFAULT_VALUES,
      ...initialDraftState.formValues,
    },
  });
  const { control, getValues, setValue, watch } = form;

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
    swap: swapItems,
    insert: insertItem,
  } = useFieldArray({
    control,
    name: "items",
  });

  const [bannerPreviewUrls, setBannerPreviewUrls] = useState<string[]>(
    initialDraftState.bannerPreviewUrls,
  );
  const bannerPreviewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      saveCreateItemsDraft(
        values as CreateItemsFormValues,
        bannerPreviewUrlsRef.current,
      );
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    bannerPreviewUrlsRef.current = bannerPreviewUrls;
  }, [bannerPreviewUrls]);

  useEffect(() => {
    saveCreateItemsDraft(getValues(), bannerPreviewUrls);
  }, [bannerPreviewUrls, getValues]);

  useEffect(() => {
    return () => {
      bannerPreviewUrlsRef.current.forEach((previewUrl) => {
        revokeBlobPreviewUrl(previewUrl);
      });

      getValues("items").forEach((item) => {
        revokeBlobPreviewUrl(item.imagePreviewUrl);
      });
    };
  }, [getValues]);

  const items = watch("items");
  const bannerPhotosLeft = Math.max(
    MAX_BANNER_PHOTOS - bannerPreviewUrls.length,
    0,
  );

  const handleBannerFilesChange = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const validImageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (validImageFiles.length === 0) {
      return;
    }

    const currentUrls = bannerPreviewUrlsRef.current;
    const remainingSlots = MAX_BANNER_PHOTOS - currentUrls.length;

    if (remainingSlots <= 0) {
      return;
    }

    const incomingFiles = validImageFiles.slice(0, remainingSlots);
    const incomingUrls = await Promise.all(
      incomingFiles.map(async (file) => {
        try {
          return await readFileAsDataUrl(file);
        } catch {
          return URL.createObjectURL(file);
        }
      }),
    );

    setBannerPreviewUrls((previousUrls) => [...previousUrls, ...incomingUrls]);
  };

  const handleRemoveBannerPhoto = (previewUrlToRemove: string) => {
    setBannerPreviewUrls((previousUrls) => {
      const nextUrls = previousUrls.filter(
        (previewUrl) => previewUrl !== previewUrlToRemove,
      );

      if (nextUrls.length !== previousUrls.length) {
        revokeBlobPreviewUrl(previewUrlToRemove);
      }

      return nextUrls;
    });
  };

  const handleItemFilesChange = async (
    itemIndex: number,
    files: FileList | null,
  ) => {
    const previewPath = `items.${itemIndex}.imagePreviewUrl` as const;
    const filePath = `items.${itemIndex}.imageFile` as const;
    const previousUrl = getValues(previewPath);
    const nextFile = files
      ? Array.from(files).find((file) => file.type.startsWith("image/"))
      : undefined;

    if (!nextFile) {
      revokeBlobPreviewUrl(previousUrl);

      setValue(previewPath, null, { shouldDirty: true, shouldTouch: true });
      setValue(filePath, null, { shouldDirty: true, shouldTouch: true });
      return;
    }

    revokeBlobPreviewUrl(previousUrl);

    const nextFileList = new DataTransfer();
    nextFileList.items.add(nextFile);

    let nextPreviewUrl: string | null = null;

    try {
      nextPreviewUrl = await readFileAsDataUrl(nextFile);
    } catch {
      nextPreviewUrl = URL.createObjectURL(nextFile);
    }

    setValue(previewPath, nextPreviewUrl, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setValue(filePath, nextFileList.files, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleRemoveItemPhoto = (itemIndex: number) => {
    const previewPath = `items.${itemIndex}.imagePreviewUrl` as const;
    const filePath = `items.${itemIndex}.imageFile` as const;
    const previewUrl = getValues(previewPath);

    revokeBlobPreviewUrl(previewUrl);

    setValue(previewPath, null, { shouldDirty: true, shouldTouch: true });
    setValue(filePath, null, { shouldDirty: true, shouldTouch: true });
  };

  const handleSwapItemUp = (itemIndex: number) => {
    if (itemIndex > 0) {
      swapItems(itemIndex, itemIndex - 1);
    }
  };

  const handleSwapItemDown = (itemIndex: number) => {
    if (itemIndex < itemFields.length - 1) {
      swapItems(itemIndex, itemIndex + 1);
    }
  };

  const handleDuplicateItem = (itemIndex: number) => {
    const itemValue = getValues(`items.${itemIndex}` as const);

    insertItem(itemIndex + 1, {
      ...itemValue,
      imageFile: null,
      imagePreviewUrl: null,
      options: itemValue.options.map((option) => ({ ...option })),
    });
  };

  const handleRemoveItem = (itemIndex: number) => {
    const itemValue = getValues(`items.${itemIndex}` as const);

    revokeBlobPreviewUrl(itemValue.imagePreviewUrl);

    if (itemFields.length === 1) {
      setValue("items.0", createDefaultItem(), {
        shouldDirty: true,
        shouldTouch: true,
      });
      return;
    }

    removeItem(itemIndex);
  };

  const handleAddItem = () => {
    appendItem(createDefaultItem());
  };

  const handleAddOption = (itemIndex: number) => {
    const optionPath = `items.${itemIndex}.options` as const;
    const options = getValues(optionPath);

    setValue(optionPath, [...options, { value: "" }], {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleRemoveOption = (itemIndex: number, optionIndex: number) => {
    const optionPath = `items.${itemIndex}.options` as const;
    const options = getValues(optionPath);

    setValue(
      optionPath,
      options.filter((_, index) => index !== optionIndex),
      {
        shouldDirty: true,
        shouldTouch: true,
      },
    );
  };

  const getItemPreviewUrl = (itemIndex: number) =>
    items?.[itemIndex]?.imagePreviewUrl ?? null;

  const getItemOptions = (itemIndex: number): ItemOptionFormValue[] =>
    items?.[itemIndex]?.options ?? [];

  const getItemOptionGroups = (
    itemIndex: number,
  ): NonNullable<CreateItemsFormValues["items"][number]["optionGroups"]> =>
    items?.[itemIndex]?.optionGroups ?? [];

  const handleRemoveOptionGroup = (itemIndex: number, groupIndex: number) => {
    const path = `items.${itemIndex}.optionGroups` as const;
    const groups = getValues(path) ?? [];
    setValue(
      path,
      groups.filter((_, i) => i !== groupIndex),
      { shouldDirty: true, shouldTouch: true },
    );
  };

  const handleRemoveGroupChoice = (
    itemIndex: number,
    groupIndex: number,
    choiceIndex: number,
  ) => {
    const path =
      `items.${itemIndex}.optionGroups.${groupIndex}.choices` as const;
    const choices = getValues(path) ?? [];
    setValue(
      path,
      choices.filter((_, i) => i !== choiceIndex),
      { shouldDirty: true, shouldTouch: true },
    );
  };

  const handleSubmit = (values: CreateItemsFormValues) => {
    saveCreateItemsDraft(values, bannerPreviewUrlsRef.current);
    navigateToNextStep(values);
  };

  return {
    form,
    itemFields,
    bannerPreviewUrls,
    bannerPhotosLeft,
    handleSubmit,
    handleBannerFilesChange,
    handleRemoveBannerPhoto,
    handleItemFilesChange,
    handleRemoveItemPhoto,
    handleSwapItemUp,
    handleSwapItemDown,
    handleDuplicateItem,
    handleRemoveItem,
    handleAddItem,
    handleAddOption,
    handleRemoveOption,
    getItemPreviewUrl,
    getItemOptions,
    getItemOptionGroups,
    handleRemoveOptionGroup,
    handleRemoveGroupChoice,
  };
};
