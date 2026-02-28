import { useCurrentUserQuery } from "../../../shared/hooks/use-current-user-query";
import { useTokenAutoRefresh } from "./use-token-auto-refresh";

export function useAuthBootstrap() {

  useCurrentUserQuery();

  useTokenAutoRefresh();
}
