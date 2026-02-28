import { isAxiosError } from "axios";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import api from "../../../shared/services/api";
import { CREATE_EVENT_DRAFT_STORAGE_KEY } from "../constants/create-event-constants";
import { CREATE_ITEMS_DRAFT_STORAGE_KEY } from "../constants/create-items-constants";
import {
  ConfirmItemRow,
  CreatedConfirmViewModel,
} from "../types/created-confirm-types";

const isDataUrl = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("data:");

interface PublishDraftItem {
  imagePreviewUrl?: unknown;
  imageFile?: unknown;
  [key: string]: unknown;
}

interface CreateItemsDraftPayload {
  items?: PublishDraftItem[];
  bannerPreviewUrls?: unknown[];
  [key: string]: unknown;
}

interface PublishPayload {
  createEventDraft?: Record<string, unknown> | null;
  createItemsDraft?: CreateItemsDraftPayload | null;
}

const sanitizePublishPayload = (payload: PublishPayload): PublishPayload => {
  const createEventDraft = payload?.createEventDraft || {};
  const createItemsDraft = payload?.createItemsDraft || {};

  const sanitizedItems = Array.isArray(createItemsDraft.items)
    ? createItemsDraft.items.map((item: PublishDraftItem) => ({
        ...item,
        imagePreviewUrl: isDataUrl(item?.imagePreviewUrl)
          ? null
          : item?.imagePreviewUrl || null,
        imageFile: null,
      }))
    : [];

  const sanitizedBannerPreviewUrls = Array.isArray(
    createItemsDraft.bannerPreviewUrls,
  )
    ? createItemsDraft.bannerPreviewUrls.filter(
        (previewUrl) =>
          typeof previewUrl === "string" && !isDataUrl(previewUrl),
      )
    : [];

  return {
    createEventDraft,
    createItemsDraft: {
      ...createItemsDraft,
      items: sanitizedItems,
      bannerPreviewUrls: sanitizedBannerPreviewUrls,
    },
  };
};

const getPublishErrorMessage = (error: unknown): string => {
  const apiMessage = isAxiosError(error) ? error.response?.data?.message : null;

  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }

  if (isAxiosError(error) && error.response?.status === 413) {
    return "Request payload is too large. Please reduce image size and try again.";
  }

  return "Unable to publish event right now. Please try again.";
};

export const useCreatedConfirm = (): CreatedConfirmViewModel => {
  const navigate = useNavigate();
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // ── Read draft data from localStorage on mount ──────────────────────────
  const draft = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(CREATE_EVENT_DRAFT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }, []);

  const itemsDraft = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(CREATE_ITEMS_DRAFT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }, []);

  const confirmItems = useMemo((): ConfirmItemRow[] => {
    const rawItems = Array.isArray(itemsDraft?.items) ? itemsDraft.items : [];
    return (rawItems as Array<Record<string, unknown>>).map((item) => ({
      name:
        typeof item.name === "string" && item.name.trim()
          ? item.name
          : "Untitled item",
      price:
        typeof item.price === "string" && item.price.trim()
          ? item.price
          : "$0.00",
      imagePreviewUrl:
        typeof item.imagePreviewUrl === "string" && item.imagePreviewUrl.trim()
          ? item.imagePreviewUrl
          : null,
      options: Array.isArray(item.options)
        ? (item.options as Array<Record<string, unknown>>)
            .filter(
              (o) => typeof o.value === "string" && (o.value as string).trim(),
            )
            .map((o) => ({ value: o.value as string }))
        : [],
      optionGroups: Array.isArray(item.optionGroups)
        ? (item.optionGroups as Array<Record<string, unknown>>).map((g) => ({
            name: typeof g.name === "string" ? g.name : "",
            required: typeof g.required === "boolean" ? g.required : false,
            choices: Array.isArray(g.choices)
              ? (g.choices as Array<Record<string, unknown>>).map((c) => ({
                  id: typeof c.id === "string" ? c.id : "",
                  name: typeof c.name === "string" ? c.name : "",
                  price: typeof c.price === "number" ? c.price : 0,
                }))
              : [],
          }))
        : [],
    }));
  }, [itemsDraft]);

  const handleOpenPublishModal = useCallback(() => {
    setPublishError(null);
    setIsPublishModalOpen(true);
  }, []);

  const handleClosePublishModal = useCallback(() => {
    setIsPublishModalOpen(false);
  }, []);

  const clearCreateEventProcessState = useCallback(() => {
    // Modal state is now local to each component — no global state to clean up.
  }, []);

  const clearCreateEventProcessStorage = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(CREATE_EVENT_DRAFT_STORAGE_KEY);
    window.localStorage.removeItem(CREATE_ITEMS_DRAFT_STORAGE_KEY);
  }, []);

  const readCreateEventDraftPayload = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    let createEventDraft = null;
    let createItemsDraft = null;

    try {
      const rawCreateEventDraft = window.localStorage.getItem(
        CREATE_EVENT_DRAFT_STORAGE_KEY,
      );
      createEventDraft = rawCreateEventDraft
        ? JSON.parse(rawCreateEventDraft)
        : null;
    } catch {
      createEventDraft = null;
    }

    try {
      const rawCreateItemsDraft = window.localStorage.getItem(
        CREATE_ITEMS_DRAFT_STORAGE_KEY,
      );
      createItemsDraft = rawCreateItemsDraft
        ? JSON.parse(rawCreateItemsDraft)
        : null;
    } catch {
      createItemsDraft = null;
    }

    return {
      createEventDraft,
      createItemsDraft,
    };
  }, []);

  const handlePublish = useCallback(async () => {
    const payload = readCreateEventDraftPayload();

    if (!payload?.createEventDraft || isPublishing) {
      return;
    }

    setIsPublishing(true);
    setPublishError(null);

    try {
      const sanitizedPayload = sanitizePublishPayload(payload);
      const response = await api.post("/events", sanitizedPayload);
      const eventId = response.data?.data?.eventId;

      if (!eventId) {
        setPublishError("Publish failed. Missing event identifier.");
        return;
      }

      clearCreateEventProcessState();
      clearCreateEventProcessStorage();
      setIsPublishModalOpen(false);
      navigate(
        `${APP_PATHS.manageOrders}?eventId=${encodeURIComponent(eventId)}`,
      );
    } catch (error) {
      setPublishError(getPublishErrorMessage(error));
    } finally {
      setIsPublishing(false);
    }
  }, [
    clearCreateEventProcessState,
    clearCreateEventProcessStorage,
    isPublishing,
    navigate,
    readCreateEventDraftPayload,
  ]);

  return {
    // draft data
    title:
      typeof draft?.title === "string" && draft.title.trim()
        ? draft.title
        : "(No title)",
    closingDate:
      typeof draft?.closingDate === "string" ? draft.closingDate : "",
    collectionDate:
      typeof draft?.collectionDate === "string" ? draft.collectionDate : "",
    collectionTime:
      typeof draft?.collectionTime === "string" ? draft.collectionTime : "",
    pickupLocation:
      typeof draft?.pickupLocation === "string" ? draft.pickupLocation : "",
    adminFee:
      typeof draft?.adminFee === "string" && draft.adminFee.trim()
        ? draft.adminFee
        : "0",
    mode:
      typeof draft?.mode === "string" && draft.mode.trim()
        ? draft.mode
        : "group-buy",
    items: confirmItems,
    bannerPreviewUrls: Array.isArray(itemsDraft?.bannerPreviewUrls)
      ? (itemsDraft.bannerPreviewUrls as unknown[]).filter(
          (u): u is string => typeof u === "string" && u.trim().length > 0,
        )
      : [],
    hasDraft: draft !== null,
    // publish modal
    isPublishModalOpen,
    isPublishing,
    publishError,
    handleOpenPublishModal,
    handleClosePublishModal,
    handlePublish,
  };
};
