import { useCallback } from "react";
import {
  FieldErrors,
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form";
import { z } from "zod";
import { scrollToFirstError } from "./form-utils";
import { useZodForm } from "./use-zod-form";

interface UseSmartFormOptions<TFormValues extends FieldValues> extends Omit<
  UseFormProps<TFormValues>,
  "resolver"
> {
  schema: z.ZodTypeAny;
  scrollOffset?: number;
  onInvalid?: SubmitErrorHandler<TFormValues>;
}

type SmartFormSubmit<TFormValues extends FieldValues> = (
  onValid: SubmitHandler<TFormValues>,
  onInvalid?: SubmitErrorHandler<TFormValues>,
) => (event?: React.BaseSyntheticEvent) => Promise<void>;

export type UseSmartFormReturn<TFormValues extends FieldValues> =
  UseFormReturn<TFormValues> & {
    handleSmartSubmit: SmartFormSubmit<TFormValues>;
    scrollToFirstError: (errors: FieldErrors<TFormValues>) => void;
  };

export function useSmartForm<TFormValues extends FieldValues>({
  schema,
  scrollOffset = 140,
  onInvalid,
  ...restOptions
}: UseSmartFormOptions<TFormValues>): UseSmartFormReturn<TFormValues> {
  const form = useZodForm<TFormValues>(schema, {
    mode: "onBlur",
    criteriaMode: "all",
    shouldFocusError: false,
    ...restOptions,
  });

  const scrollFirstError = useCallback(
    (errors: FieldErrors<TFormValues>) => {
      scrollToFirstError(errors, scrollOffset, (fieldPath) => {
        form.setFocus(fieldPath as never);
      });
    },
    [form, scrollOffset],
  );

  const handleSmartSubmit = useCallback<SmartFormSubmit<TFormValues>>(
    (onValid, onInvalidOverride) =>
      form.handleSubmit(onValid, (errors) => {
        scrollFirstError(errors);
        onInvalid?.(errors);
        onInvalidOverride?.(errors);
      }),
    [form, onInvalid, scrollFirstError],
  );

  return {
    ...form,
    handleSmartSubmit,
    scrollToFirstError: scrollFirstError,
  };
}
