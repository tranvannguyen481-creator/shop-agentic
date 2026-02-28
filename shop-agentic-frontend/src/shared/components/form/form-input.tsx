import { ComponentProps } from "react";
import {
  FieldPath,
  FieldValues,
  RegisterOptions,
  get,
  useFormContext,
} from "react-hook-form";
import { Input } from "../ui";
import styles from "./index.module.scss";
import { useRequiredFields } from "./required-fields-context";

type BaseInputProps = Omit<ComponentProps<typeof Input>, "name">;

interface FormInputProps<
  TFormValues extends FieldValues,
> extends BaseInputProps {
  name: FieldPath<TFormValues>;
  rules?: RegisterOptions<TFormValues, FieldPath<TFormValues>>;
}

function FormInput<TFormValues extends FieldValues>({
  name,
  rules,
  ...inputProps
}: FormInputProps<TFormValues>) {
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
    inputProps.requiredMark ??
    Boolean(inputProps.required || isRequiredFromRules || isRequiredFromSchema);
  const isInvalid = Boolean(fieldError?.message);
  const errorId = `${String(name)}-error`.replace(/\./g, "-");

  return (
    <div className={styles.fieldGroup}>
      <Input
        {...inputProps}
        requiredMark={requiredMark}
        aria-invalid={isInvalid || undefined}
        aria-describedby={isInvalid ? errorId : inputProps["aria-describedby"]}
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

export default FormInput;
