import api from "../../../shared/services/api";
import { CreateEventFormValues } from "../types/create-event-types";
import { CreateItemsFormValues } from "../types/create-items-types";

export interface EventEditDraftPayload {
  createEventDraft?: Partial<CreateEventFormValues>;
  createItemsDraft?: {
    items: CreateItemsFormValues["items"];
    bannerPreviewUrls?: string[];
  };
}

const inFlightDraftRequests = new Map<
  string,
  Promise<EventEditDraftPayload | null>
>();

const draftCache = new Map<string, EventEditDraftPayload | null>();

export const fetchEventEditDraft = async (
  eventId: string,
): Promise<EventEditDraftPayload | null> => {
  if (!eventId) {
    return null;
  }

  if (draftCache.has(eventId)) {
    return draftCache.get(eventId) ?? null;
  }

  const inFlightRequest = inFlightDraftRequests.get(eventId);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = api
    .get(`/events/${encodeURIComponent(eventId)}/edit-draft`)
    .then(
      (response) =>
        (response.data?.data ?? null) as EventEditDraftPayload | null,
    )
    .then((payload) => {
      draftCache.set(eventId, payload);
      return payload;
    })
    .finally(() => {
      inFlightDraftRequests.delete(eventId);
    });

  inFlightDraftRequests.set(eventId, request);
  return request;
};
