import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "../services/auth-api";

export const CURRENT_USER_QUERY_KEY = ["currentUser"] as const;

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
    retry: false,
  });
}
