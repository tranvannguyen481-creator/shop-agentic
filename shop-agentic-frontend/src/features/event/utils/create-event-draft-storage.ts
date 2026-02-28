import { CREATE_EVENT_DRAFT_STORAGE_KEY } from "../constants/create-event-constants";
import { CreateEventFormValues } from "../types/create-event-types";

type PersistedDraft = Omit<CreateEventFormValues, "uploadExcel"> & {
  uploadExcel: null;
};

export const toPersistedEventDraft = (
  values: CreateEventFormValues,
): PersistedDraft => ({
  ...values,
  uploadExcel: null,
});

export const getStoredCreateEventDraft = (): Partial<CreateEventFormValues> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawDraft = window.localStorage.getItem(
      CREATE_EVENT_DRAFT_STORAGE_KEY,
    );

    if (!rawDraft) {
      return {};
    }

    const parsedDraft = JSON.parse(rawDraft) as Partial<CreateEventFormValues>;

    return {
      ...parsedDraft,
      uploadExcel: null,
    };
  } catch {
    return {};
  }
};

export const saveCreateEventDraft = (values: CreateEventFormValues) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CREATE_EVENT_DRAFT_STORAGE_KEY,
      JSON.stringify(toPersistedEventDraft(values)),
    );
  } catch {
    // Ignore storage write failures.
  }
};
