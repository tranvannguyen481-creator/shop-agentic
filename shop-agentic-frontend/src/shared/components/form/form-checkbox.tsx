import { ComponentProps } from "react";
import { FieldPath, FieldValues, get, useFormContext } from "react-hook-form";
import { Checkbox } from "../ui";
import styles from "./index.module.scss";

type BaseCheckboxProps = Omit<ComponentProps<typeof Checkbox>, "name">;

interface FormCheckboxProps<
  TFormValues extends FieldValues,
> extends BaseCheckboxProps {
  name: FieldPath<TFormValues>;
}

function FormCheckbox<TFormValues extends FieldValues>({
  name,
  ...checkboxProps
}: FormCheckboxProps<TFormValues>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<TFormValues>();

  const fieldError = get(errors, name);
  const registerField = register(name);
  const { onChange: checkboxOnChange, ...restCheckboxProps } = checkboxProps;

  return (
    <div className={styles.fieldGroup}>
      <Checkbox
        {...restCheckboxProps}
        {...registerField}
        onChange={(event) => {
          registerField.onChange(event);
          checkboxOnChange?.(event);
        }}
      />
      {fieldError?.message && (
        <p className={styles.error}>{String(fieldError.message)}</p>
      )}
    </div>
  );
}

export default FormCheckbox;
