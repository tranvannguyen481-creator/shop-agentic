import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { CURRENT_USER_QUERY_KEY } from "../../../shared/hooks/use-current-user-query";
import {
  signInWithGoogle,
  signUpWithGoogle,
} from "../../../shared/services/auth-api";

type GoogleAuthMode = "sign-in" | "sign-up";

export function useGoogleAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const fromState = (
    location.state as { from?: { pathname?: string; search?: string } } | null
  )?.from;

  const fromPath =
    typeof fromState?.pathname === "string" ? fromState.pathname : null;

  const fromSearch =
    typeof fromState?.search === "string" ? fromState.search : "";

  const redirectPath =
    fromPath && fromPath !== APP_PATHS.signIn && fromPath !== APP_PATHS.signUp
      ? fromPath + fromSearch
      : APP_PATHS.welcome;

  const getFriendlyError = (error: unknown): string => {
    if (isAxiosError(error)) {
      const apiMessage = error.response?.data?.message;
      if (typeof apiMessage === "string" && apiMessage.trim()) {
        return apiMessage;
      }
    }
    return error instanceof Error ? error.message : "Google sign in failed";
  };

  const signInMutation = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
    },
  });

  const signUpMutation = useMutation({
    mutationFn: signUpWithGoogle,
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
    },
  });

  const googleAuth = async (mode: GoogleAuthMode): Promise<boolean> => {
    try {
      if (mode === "sign-up") {
        await signUpMutation.mutateAsync();
      } else {
        await signInMutation.mutateAsync();
      }
      return true;
    } catch {
      return false;
    }
  };

  const googleAuthAndRedirect = async (
    mode: GoogleAuthMode,
  ): Promise<boolean> => {
    const success = await googleAuth(mode);
    if (success) {
      navigate(redirectPath, { replace: true });
    }
    return success;
  };

  const activeMutation = signInMutation.isPending
    ? signInMutation
    : signUpMutation;

  return {
    googleAuth,
    googleAuthAndRedirect,
    isSubmitting: signInMutation.isPending || signUpMutation.isPending,
    submitError: activeMutation.isError
      ? getFriendlyError(activeMutation.error)
      : null,
  };
}
