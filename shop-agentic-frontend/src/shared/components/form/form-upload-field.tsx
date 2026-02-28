import { ComponentProps } from "react";
import { FieldPath, FieldValues, get, useFormContext } from "react-hook-form";
import { UploadField } from "../ui";
import styles from "./index.module.scss";
import { useRequiredFields } from "./required-fields-context";

type BaseUploadFieldProps = Omit<
  ComponentProps<typeof UploadField>,
  "onFilesChange"
>;

interface FormUploadFieldProps<
  TFormValues extends FieldValues,
> extends BaseUploadFieldProps {
  name: FieldPath<TFormValues>;
  onFilesChange?: (files: FileList | null) => void;
}

function FormUploadField<TFormValues extends FieldValues>({
  name,
  onFilesChange,
  ...uploadFieldProps
}: FormUploadFieldProps<TFormValues>) {
  const {
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext<TFormValues>();
  const requiredFields = useRequiredFields();

  const fieldError = get(errors, name);
  const requiredMark =
    uploadFieldProps.requiredMark ??
    Boolean(requiredFields?.has(String(name as string)));
  const isInvalid = Boolean(fieldError?.message);
  const errorId = `${String(name)}-error`.replace(/\./g, "-");

  const handleFilesChange = (files: FileList | null) => {
    setValue(name, files as never, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    onFilesChange?.(files);
    void trigger(name);
  };

  return (
    <div className={styles.fieldGroup}>
      <UploadField
        {...uploadFieldProps}
        requiredMark={requiredMark}
        aria-invalid={isInvalid || undefined}
        aria-describedby={
          isInvalid ? errorId : uploadFieldProps["aria-describedby"]
        }
        onFilesChange={handleFilesChange}
      />
      {fieldError?.message && (
        <p id={errorId} role="alert" className={styles.error}>
          {String(fieldError.message)}
        </p>
      )}
    </div>
  );
}

export default FormUploadField;
