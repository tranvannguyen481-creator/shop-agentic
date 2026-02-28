import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import {
  fetchHostedEvents,
  type HostedEventItem,
} from "../../../shared/services/event-api";
import type {
  EventFilterTab,
  EventSortKey,
} from "../components/event-list-view";

const HOSTED_EVENTS_PAGE_SIZE = 50;

export const useListMyEventsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<EventFilterTab>("all");
  const [sortKey, setSortKey] = useState<EventSortKey>("closing");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["hostedEvents"],
    queryFn: () => fetchHostedEvents(1, HOSTED_EVENTS_PAGE_SIZE),
  });

  const allEvents = useMemo(
    () => (data?.items ?? []) as HostedEventItem[],
    [data],
  );

  const activeCount = useMemo(
    () =>
      allEvents.filter((e) => {
        const s = String(e.status ?? "").toLowerCase();
        return !(s === "closed" || s.includes("close") || s.includes("end"));
      }).length,
    [allEvents],
  );

  const closedCount = useMemo(
    () =>
      allEvents.filter((e) => {
        const s = String(e.status ?? "").toLowerCase();
        return s === "closed" || s.includes("close") || s.includes("end");
      }).length,
    [allEvents],
  );

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const isClosedStatus = (status: string | undefined) => {
      const s = String(status ?? "").toLowerCase();
      return s === "closed" || s.includes("close") || s.includes("end");
    };

    let list = allEvents;

    if (filterTab === "active") {
      list = list.filter((e) => !isClosedStatus(e.status));
    } else if (filterTab === "closed") {
      list = list.filter((e) => isClosedStatus(e.status));
    }

    if (keyword) {
      list = list.filter((event) => {
        const title = String(event.title ?? "").toLowerCase();
        const description = String(event.description ?? "").toLowerCase();
        return title.includes(keyword) || description.includes(keyword);
      });
    }

    list = [...list].sort((a, b) => {
      if (sortKey === "closing") {
        const aDate = a.closingDate
          ? new Date(a.closingDate).getTime()
          : Infinity;
        const bDate = b.closingDate
          ? new Date(b.closingDate).getTime()
          : Infinity;
        return aDate - bDate;
      }
      return String(a.title ?? "").localeCompare(String(b.title ?? ""));
    });

    return list;
  }, [allEvents, search, filterTab, sortKey]);

  const toEventDetailPath = (eventId: string) =>
    APP_PATHS.eventDetail.replace(":eventId", encodeURIComponent(eventId));

  return {
    events: filteredEvents,
    total: data?.total ?? 0,
    activeCount,
    closedCount,
    isLoading,
    isFetching,
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch events"
      : null,
    search,
    onSearchChange: setSearch,
    filterTab,
    onFilterTabChange: setFilterTab,
    sortKey,
    onSortChange: setSortKey,
    onRefresh: () => void refetch(),
    onCreateFirstEvent: () => navigate(APP_PATHS.createEvent),
    onEditEvent: (eventId: string) =>
      navigate(`${APP_PATHS.updateEvent}?id=${encodeURIComponent(eventId)}`),
    onViewDetail: (eventId: string) => navigate(toEventDetailPath(eventId)),
    onShareEvent: (eventId: string) => {
      const url = `${window.location.origin}${toEventDetailPath(eventId)}`;
      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(url);
      }
    },
  };
};
