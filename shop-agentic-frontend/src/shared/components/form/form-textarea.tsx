import { ComponentProps } from "react";
import {
  FieldPath,
  FieldValues,
  RegisterOptions,
  get,
  useFormContext,
} from "react-hook-form";
import { Textarea } from "../ui";
import styles from "./index.module.scss";
import { useRequiredFields } from "./required-fields-context";

type BaseTextareaProps = Omit<ComponentProps<typeof Textarea>, "name">;

interface FormTextareaProps<
  TFormValues extends FieldValues,
> extends BaseTextareaProps {
  name: FieldPath<TFormValues>;
  rules?: RegisterOptions<TFormValues, FieldPath<TFormValues>>;
}

function FormTextarea<TFormValues extends FieldValues>({
  name,
  rules,
  ...textareaProps
}: FormTextareaProps<TFormValues>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<TFormValues>();
  const requiredFields = useRequiredFields();

  const fieldError = get(errors, name);
  const isRequiredFromRules = Boolean(rules?.required);
  const isRequiredFromSchema =
    requiredFields?.has(String(name as string)) ?? false;
  const requiredMark =
    textareaProps.requiredMark ??
    Boolean(
      textareaProps.required || isRequiredFromRules || isRequiredFromSchema,
    );
  const isInvalid = Boolean(fieldError?.message);
  const errorId = `${String(name)}-error`.replace(/\./g, "-");

  return (
    <div className={styles.fieldGroup}>
      <Textarea
        {...textareaProps}
        requiredMark={requiredMark}
        aria-invalid={isInvalid || undefined}
        aria-describedby={
          isInvalid ? errorId : textareaProps["aria-describedby"]
        }
        {...register(name, rules)}
      />
      {fieldError?.message && (
        <p id={errorId} role="alert" className={styles.error}>
          {String(fieldError.message)}
        </p>
      )}
    </div>
  );
}

export default FormTextarea;
