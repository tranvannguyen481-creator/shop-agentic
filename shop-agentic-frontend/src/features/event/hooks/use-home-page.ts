import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import {
  fetchGroupEvents,
  reHostEvent,
} from "../../../shared/services/event-api";
import type {
  EventFilterTab,
  EventSortKey,
} from "../components/event-list-view";
import type { GroupEventItem } from "../types/event-list-types";

const HOME_PAGE_SIZE = 50;

export const useHomePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<EventFilterTab>("all");
  const [sortKey, setSortKey] = useState<EventSortKey>("closing");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["groupEvents"],
    queryFn: () => fetchGroupEvents(1, HOME_PAGE_SIZE),
  });

  const reHostMutation = useMutation({
    mutationFn: (eventId: string) => reHostEvent(eventId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["groupEvents"] });
      navigate(
        APP_PATHS.updateEvent + "?id=" + encodeURIComponent(result.eventId),
      );
    },
  });

  const allEvents = useMemo(
    () => (data?.items ?? []) as GroupEventItem[],
    [data],
  );

  const activeCount = useMemo(
    () =>
      allEvents.filter((e) => String(e.status ?? "").toLowerCase() !== "closed")
        .length,
    [allEvents],
  );

  const closedCount = useMemo(
    () =>
      allEvents.filter((e) => String(e.status ?? "").toLowerCase() === "closed")
        .length,
    [allEvents],
  );

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let list = allEvents;

    // Tab filter
    if (filterTab === "active") {
      list = list.filter(
        (e) => String(e.status ?? "").toLowerCase() !== "closed",
      );
    } else if (filterTab === "closed") {
      list = list.filter(
        (e) => String(e.status ?? "").toLowerCase() === "closed",
      );
    }

    // Keyword filter
    if (keyword) {
      list = list.filter((event) => {
        const title = String(event.title ?? "").toLowerCase();
        const description = String(event.description ?? "").toLowerCase();
        const groupName = String(event.groupName ?? "").toLowerCase();
        return (
          title.includes(keyword) ||
          description.includes(keyword) ||
          groupName.includes(keyword)
        );
      });
    }

    // Sort
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

  const onViewDetail = (eventId: string) => {
    navigate(APP_PATHS.eventDetail.replace(":eventId", eventId));
  };

  const onReHost = (eventId: string) => {
    reHostMutation.mutate(eventId);
  };

  const onRefresh = () => {
    void refetch();
  };

  return {
    events: filteredEvents,
    total: data?.total ?? 0,
    activeCount,
    closedCount,
    isLoading,
    isFetching,
    error: error ? String(error) : null,
    search,
    onSearchChange: setSearch,
    filterTab,
    onFilterTabChange: setFilterTab,
    sortKey,
    onSortChange: setSortKey,
    onViewDetail,
    onReHost,
    onRefresh,
    isReHosting: reHostMutation.isPending,
    reHostingEventId: reHostMutation.variables ?? null,
  };
};
