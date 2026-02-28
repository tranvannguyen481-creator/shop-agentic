import { ComponentProps } from "react";
import {
  FieldPath,
  FieldValues,
  RegisterOptions,
  get,
  useFormContext,
} from "react-hook-form";
import { DateTimePicker } from "../ui";
import styles from "./index.module.scss";
import { useRequiredFields } from "./required-fields-context";

type BaseDateTimePickerProps = Omit<
  ComponentProps<typeof DateTimePicker>,
  "inputProps"
>;

interface FormDateTimePickerProps<
  TFormValues extends FieldValues,
> extends BaseDateTimePickerProps {
  name: FieldPath<TFormValues>;
  rules?: RegisterOptions<TFormValues, FieldPath<TFormValues>>;
  inputProps?: ComponentProps<typeof DateTimePicker>["inputProps"];
}

function FormDateTimePicker<TFormValues extends FieldValues>({
  name,
  rules,
  inputProps,
  wrapperClassName,
  ...dateTimePickerProps
}: FormDateTimePickerProps<TFormValues>) {
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
    dateTimePickerProps.requiredMark ??
    Boolean(
      inputProps?.required || isRequiredFromRules || isRequiredFromSchema,
    );
  const isInvalid = Boolean(fieldError?.message);
  const errorId = `${String(name)}-error`.replace(/\./g, "-");
  const registeredInput = register(name, rules);
  const fieldGroupClassName = `${styles.fieldGroup} ${
    wrapperClassName ?? ""
  }`.trim();

  return (
    <div className={fieldGroupClassName}>
      <DateTimePicker
        {...dateTimePickerProps}
        wrapperClassName={undefined}
        requiredMark={requiredMark}
        inputProps={{
          ...inputProps,
          ...registeredInput,
          "aria-invalid": isInvalid || undefined,
          "aria-describedby": isInvalid
            ? errorId
            : inputProps?.["aria-describedby"],
        }}
      />
      {fieldError?.message && (
        <p id={errorId} role="alert" className={styles.error}>
          {String(fieldError.message)}
        </p>
      )}
    </div>
  );
}

export default FormDateTimePicker;
