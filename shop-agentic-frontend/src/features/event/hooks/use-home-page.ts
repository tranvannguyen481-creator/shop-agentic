import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import {
  fetchGroupEvents,
  reHostEvent,
  type GroupEventItem,
} from "../../../shared/services/event-api";

const HOME_PAGE_SIZE = 50;

export const useHomePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
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

  const filteredEvents = useMemo(() => {
    const events = (data?.items ?? []) as GroupEventItem[];
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return events;
    }

    return events.filter((event) => {
      const title = String(event.title ?? "").toLowerCase();
      const description = String(event.description ?? "").toLowerCase();
      const groupName = String(event.groupName ?? "").toLowerCase();
      return (
        title.includes(keyword) ||
        description.includes(keyword) ||
        groupName.includes(keyword)
      );
    });
  }, [data, search]);

  const onViewDetail = (eventId: string) => {
    navigate(APP_PATHS.eventDetail.replace(":eventId", eventId));
  };

  const onReHost = (eventId: string) => {
    reHostMutation.mutate(eventId);
  };

  return {
    events: filteredEvents,
    total: data?.total ?? 0,
    isLoading,
    error: error ? String(error) : null,
    search,
    onSearchChange: setSearch,
    onViewDetail,
    onReHost,
    isReHosting: reHostMutation.isPending,
    reHostingEventId: reHostMutation.variables ?? null,
  };
};
