import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { useSmartForm } from "../../../shared/components/form";
import api from "../../../shared/services/api";
import { signUpProfileSchema } from "../schemas/sign-up-profile-schema";
import { SignUpProfileFormValues } from "../types/sign-up-profile-types";

export function useSignUpProfileForm() {
  const navigate = useNavigate();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const profileForm = useSmartForm<SignUpProfileFormValues>({
    schema: signUpProfileSchema,
    defaultValues: {
      mobileNumber: "",
      postalCode: "",
    },
  });

  const onProfileSubmit = async (values: SignUpProfileFormValues) => {
    setProfileError(null);
    setIsSubmittingProfile(true);

    try {
      await api.post("/auth/complete-profile", values);
      navigate(APP_PATHS.welcome);
    } catch {
      setProfileError("Unable to complete sign-up. Please try again.");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  return {
    profileForm,
    onProfileSubmit,
    isSubmittingProfile,
    profileError,
  };
}
