import { useSmartForm } from "../../../shared/components/form";
import { signInSchema } from "../schemas/sign-in-schema";
import { SignInFormValues } from "../types/sign-in-types";

export function useSignInForm() {
  return useSmartForm<SignInFormValues>({
    schema: signInSchema,
    defaultValues: {
      email: "",
      pin: "",
    },
  });
}
