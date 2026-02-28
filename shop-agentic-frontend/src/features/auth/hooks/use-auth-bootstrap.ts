import { useCurrentUserQuery } from "../../../shared/hooks/use-current-user-query";

export function useAuthBootstrap() {
  // Prefetch the current user query so it's ready before route guards check it.
  useCurrentUserQuery();
}
