import { ComponentProps } from "react";
import {
  FieldPath,
  FieldValues,
  RegisterOptions,
  get,
  useFormContext,
} from "react-hook-form";
import { Select } from "../ui";
import styles from "./index.module.scss";
import { useRequiredFields } from "./required-fields-context";

type BaseSelectProps = Omit<ComponentProps<typeof Select>, "name">;

interface FormSelectProps<
  TFormValues extends FieldValues,
> extends BaseSelectProps {
  name: FieldPath<TFormValues>;
  rules?: RegisterOptions<TFormValues, FieldPath<TFormValues>>;
}

function FormSelect<TFormValues extends FieldValues>({
  name,
  rules,
  ...selectProps
}: FormSelectProps<TFormValues>) {
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
    selectProps.requiredMark ??
    Boolean(
      selectProps.required || isRequiredFromRules || isRequiredFromSchema,
    );
  const isInvalid = Boolean(fieldError?.message);
  const errorId = `${String(name)}-error`.replace(/\./g, "-");

  return (
    <div className={styles.fieldGroup}>
      <Select
        {...selectProps}
        requiredMark={requiredMark}
        aria-invalid={isInvalid || undefined}
        aria-describedby={isInvalid ? errorId : selectProps["aria-describedby"]}
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

export default FormSelect;
