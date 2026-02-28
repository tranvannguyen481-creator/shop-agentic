import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { CURRENT_USER_QUERY_KEY } from "../../../shared/hooks/use-current-user-query";
import { signOutSession } from "../../../shared/services/auth-api";

export function useSignOutSubmit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: signOutSession,
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      queryClient.clear();
      navigate(APP_PATHS.signIn, { replace: true });
    },
  });

  return {
    onSignOut: () => mutation.mutate(),
    isSubmitting: mutation.isPending,
  };
}
