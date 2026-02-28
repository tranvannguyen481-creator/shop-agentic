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

export const fetchEventEditDraft = async (
  eventId: string,
): Promise<EventEditDraftPayload | null> => {
  if (!eventId) {
    return null;
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
    .finally(() => {
      inFlightDraftRequests.delete(eventId);
    });

  inFlightDraftRequests.set(eventId, request);
  return request;
};
