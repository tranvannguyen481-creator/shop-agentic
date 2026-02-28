import { useCurrentUserQuery } from "../../../shared/hooks/use-current-user-query";
import { useTokenAutoRefresh } from "./use-token-auto-refresh";

export function useAuthBootstrap() {
  // Prefetch the current user query so it's ready before route guards check it.
  useCurrentUserQuery();

  // Proactively sync the session cookie whenever Firebase refreshes the ID token.
  useTokenAutoRefresh();
}
