import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { CURRENT_USER_QUERY_KEY } from "../../../shared/hooks/use-current-user-query";
import { signInWithEmailAndPin } from "../../../shared/services/auth-api";
import { SignInFormValues } from "../types/sign-in-types";
import { useGoogleAuth } from "./use-google-auth";

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;
    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }
  }
  return error instanceof Error ? error.message : "Sign in failed";
};

export function useSignInSubmit() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { googleAuthAndRedirect, isSubmitting: isGoogleSubmitting } =
    useGoogleAuth();

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

  const mutation = useMutation({
    mutationFn: ({ email, pin }: { email: string; pin: string }) =>
      signInWithEmailAndPin(email, pin),
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      navigate(redirectPath, { replace: true });
    },
  });

  const onSubmit = (values: SignInFormValues) => {
    mutation.mutate({ email: values.email, pin: values.pin });
  };

  const onGoogleSignIn = () => googleAuthAndRedirect("sign-in");

  return {
    onSubmit,
    onGoogleSignIn,
    isSubmitting: mutation.isPending || isGoogleSubmitting,
    submitError: mutation.isError ? getErrorMessage(mutation.error) : null,
  };
}
