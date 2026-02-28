import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { fetchHostedEvents } from "../../../shared/services/event-api";

const HOSTED_EVENTS_PAGE = 1;
const HOSTED_EVENTS_PAGE_SIZE = 50;

interface HostedEventItem {
  id: string;
  title?: string;
  description?: string;
  closingDate?: string;
  collectionDate?: string;
  buyCount?: number;
  adminFee?: string;
  status?: string;
  closingInText?: string;
  deliveryInText?: string;
  hostDisplayName?: string;
  [key: string]: unknown;
}

export const useListMyEventsPage = () => {
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["hostedEvents", HOSTED_EVENTS_PAGE, HOSTED_EVENTS_PAGE_SIZE],
    queryFn: () =>
      fetchHostedEvents(HOSTED_EVENTS_PAGE, HOSTED_EVENTS_PAGE_SIZE),
  });

  const hostedEvents = (data?.items ?? []) as HostedEventItem[];

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return hostedEvents;
    }

    return hostedEvents.filter((event) => {
      const title = String(event.title ?? "").toLowerCase();
      const description = String(event.description ?? "").toLowerCase();
      return title.includes(keyword) || description.includes(keyword);
    });
  }, [hostedEvents, search]);

  const rowVirtualizer = useVirtualizer({
    count: filteredEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems().map((virtualItem) => ({
    virtualItem,
    event: filteredEvents[virtualItem.index],
  }));

  const toEventDetailPath = (eventId: string) =>
    APP_PATHS.eventDetail.replace(":eventId", encodeURIComponent(eventId));

  return {
    search,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch events"
      : null,
    events: filteredEvents,
    parentRef,
    virtualRows,
    totalHeight: rowVirtualizer.getTotalSize(),
    onSearchChange: setSearch,
    onCreateFirstEvent: () => {
      navigate(APP_PATHS.createEvent);
    },
    onEditEvent: (eventId: string) => {
      navigate(`${APP_PATHS.updateEvent}?id=${encodeURIComponent(eventId)}`);
    },
    onViewDetail: (eventId: string) => {
      navigate(toEventDetailPath(eventId));
    },
    onShareEvent: (eventId: string) => {
      const eventUrl = `${window.location.origin}${toEventDetailPath(eventId)}`;

      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(eventUrl);
      }
    },
  };
};
