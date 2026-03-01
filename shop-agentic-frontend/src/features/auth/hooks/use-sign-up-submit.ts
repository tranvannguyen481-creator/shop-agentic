import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { useCurrentUserQuery } from "../../../shared/hooks/use-current-user-query";
import { useGoogleAuth } from "./use-google-auth";

export function useSignUpSubmit() {
  const navigate = useNavigate();
  const { googleAuth, isSubmitting, submitError } = useGoogleAuth();
  const { data: currentUser } = useCurrentUserQuery();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [agreementError, setAgreementError] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  const getFriendlyErrorMessage = (rawMessage: string | null) => {
    if (!rawMessage) {
      return null;
    }

    const normalizedMessage = rawMessage.toLowerCase();

    if (
      normalizedMessage.includes("invalid authentication token") ||
      normalizedMessage.includes("status code 401") ||
      normalizedMessage.includes("unauthorized")
    ) {
      return "Unable to verify Google account. Please try again in a few seconds.";
    }

    return rawMessage;
  };

  const onAgreementChange = (checked: boolean) => {
    setAcceptedTerms(checked);
    if (checked) {
      setAgreementError(null);
    }
  };

  const validateAgreement = () => {
    if (acceptedTerms) {
      return true;
    }

    setAgreementError(
      "Please accept Terms of Service and Privacy Policy first.",
    );
    return false;
  };

  const onGoogleSignUp = async () => {
    if (!validateAgreement()) {
      return;
    }

    const success = await googleAuth("sign-up");

    if (success) {
      setIsGoogleConnected(true);
    }
  };

  const onEmailSignUp = () => {
    if (!validateAgreement()) {
      return;
    }

    navigate(APP_PATHS.signUpEmail);
  };

  return {
    acceptedTerms,
    onAgreementChange,
    onGoogleSignUp,
    onEmailSignUp,
    isGoogleConnected,
    currentUser,
    isSubmitting,
    submitError: getFriendlyErrorMessage(submitError),
    agreementError,
  };
}
