import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useSmartForm } from "../../../shared/components/form";
import {
  CURRENT_USER_QUERY_KEY,
  useCurrentUserQuery,
} from "../../../shared/hooks/use-current-user-query";
import {
  updateUserProfile,
  type AuthUser,
} from "../../../shared/services/auth-api";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name is too long"),
  mobileNumber: z
    .string()
    .min(8, "Mobile number must be at least 8 digits")
    .max(20, "Mobile number is too long")
    .or(z.literal("")),
  postalCode: z
    .string()
    .min(3, "Postal code must be at least 3 characters")
    .max(12, "Postal code is too long")
    .or(z.literal("")),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export function useUpdateProfileForm(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUserQuery();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useSmartForm<UpdateProfileFormValues>({
    schema: updateProfileSchema,
    defaultValues: {
      displayName: "",
      mobileNumber: "",
      postalCode: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        displayName:
          typeof currentUser.displayName === "string"
            ? currentUser.displayName
            : "",
        mobileNumber:
          typeof currentUser.mobileNumber === "string"
            ? currentUser.mobileNumber
            : "",
        postalCode:
          typeof currentUser.postalCode === "string"
            ? currentUser.postalCode
            : "",
      });
    }
    // form.reset is stable from react-hook-form and does not need to be listed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const onSubmit = async (values: UpdateProfileFormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload: {
        displayName?: string;
        mobileNumber?: string;
        postalCode?: string;
      } = {
        displayName: values.displayName,
      };

      if (values.mobileNumber) {
        payload.mobileNumber = values.mobileNumber;
      }

      if (values.postalCode) {
        payload.postalCode = values.postalCode;
      }

      const updatedUser = await updateUserProfile(payload);

      queryClient.setQueryData<AuthUser>(
        [...CURRENT_USER_QUERY_KEY],
        updatedUser,
      );

      onSuccess?.();
    } catch {
      setSubmitError("Unable to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    isSubmitting,
    submitError,
  };
}
