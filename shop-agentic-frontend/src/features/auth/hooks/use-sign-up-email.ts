import { isAxiosError } from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { useSmartForm } from "../../../shared/components/form";
import { registerWithEmail } from "../../../shared/services/auth-api";
import { signUpEmailSchema } from "../schemas/sign-up-email-schema";
import { SignUpEmailFormValues } from "../types/sign-up-email-types";

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;
    if (typeof apiMessage === "string" && apiMessage.trim()) {
      if (error.response?.status === 409) {
        return "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.";
      }
      return apiMessage;
    }
  }
  return "Đã xảy ra lỗi. Vui lòng thử lại.";
};

export function useSignUpEmail() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useSmartForm<SignUpEmailFormValues>({
    schema: signUpEmailSchema,
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignUpEmailFormValues) => {
    setSubmitError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await registerWithEmail(values);
      setSuccessMessage(
        "Đăng ký thành công! Đang chuyển đến trang đăng nhập...",
      );
      setTimeout(() => {
        navigate(APP_PATHS.signIn);
      }, 1500);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    isSubmitting,
    submitError,
    successMessage,
  };
}
