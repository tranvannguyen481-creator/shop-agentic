import { FileSpreadsheet, ImagePlus } from "lucide-react";
import { ChangeEvent, ReactNode, useId, useState } from "react";
import styles from "./index.module.scss";

type UploadFieldLayout = "icon-only" | "stacked" | "inline";
type UploadFieldVariant = "default" | "image-drop";

interface UploadFieldProps {
  label?: string;
  requiredMark?: boolean;
  accept?: string;
  multiple?: boolean;
  variant?: UploadFieldVariant;
  layout?: UploadFieldLayout;
  triggerText?: string;
  supportText?: string;
  showFileName?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  onFilesChange?: (files: FileList | null) => void;
  wrapperClassName?: string;
  triggerClassName?: string;
}

const DEFAULT_EMPTY_FILE_TEXT = "No file selected";

const isSpreadsheetAccept = (accept?: string) => {
  const normalizedAccept = (accept ?? "").toLowerCase();

  return (
    normalizedAccept.includes("csv") ||
    normalizedAccept.includes("excel") ||
    normalizedAccept.includes("spreadsheet") ||
    normalizedAccept.includes("sheet") ||
    normalizedAccept.includes(".xls")
  );
};

function UploadField({
  label = "Upload file",
  requiredMark = false,
  accept,
  multiple = false,
  variant = "default",
  layout = "stacked",
  triggerText,
  supportText,
  showFileName = false,
  icon,
  disabled = false,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  onFilesChange,
  wrapperClassName,
  triggerClassName,
}: UploadFieldProps) {
  const inputId = useId();
  const [selectedFileText, setSelectedFileText] = useState(
    DEFAULT_EMPTY_FILE_TEXT,
  );
  const resolvedTriggerText =
    triggerText ?? (multiple ? "Upload files" : "Upload image");
  const resolvedDropPrompt = triggerText ?? "Drop your image here, or";
  const resolvedSupportText = supportText ?? "Supports: JPG, JPEG2000, PNG";
  const resolvedIcon =
    icon ??
    (isSpreadsheetAccept(accept) ? (
      <FileSpreadsheet size={20} strokeWidth={2.1} />
    ) : (
      <ImagePlus size={20} strokeWidth={2.1} />
    ));
  const isSpreadsheetUpload = isSpreadsheetAccept(accept);

  const layoutClassName =
    variant === "image-drop"
      ? styles.triggerImageDrop
      : layout === "inline"
        ? styles.triggerInline
        : layout === "icon-only"
          ? styles.triggerIconOnly
          : styles.triggerStacked;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      setSelectedFileText(DEFAULT_EMPTY_FILE_TEXT);
      onFilesChange?.(files);
      event.currentTarget.value = "";
      return;
    }

    if (files.length === 1) {
      setSelectedFileText(files[0].name);
    } else {
      setSelectedFileText(`${files.length} files selected`);
    }

    onFilesChange?.(files);
    event.currentTarget.value = "";
  };

  return (
    <div className={`${styles.field} ${wrapperClassName ?? ""}`.trim()}>
      {label ? (
        <span>
          {label}
          {requiredMark && <em className={styles.required}>*</em>}
        </span>
      ) : null}

      <input
        id={inputId}
        className={styles.input}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        onChange={handleChange}
      />

      <label
        htmlFor={inputId}
        className={`${styles.trigger} ${layoutClassName} ${
          isSpreadsheetUpload ? styles.triggerSpreadsheet : ""
        } ${triggerClassName ?? ""}`.trim()}
      >
        {variant === "image-drop" ? (
          <div className={styles.dropInner}>
            <span className={styles.dropIconWrap} aria-hidden="true">
              {icon ?? <ImagePlus size={42} strokeWidth={1.9} />}
            </span>
            <p className={styles.dropPrompt}>
              {resolvedDropPrompt} <span>{"browse"}</span>
            </p>
            <p className={styles.dropSupport}>{resolvedSupportText}</p>
            {showFileName && (
              <span className={styles.fileName}>{selectedFileText}</span>
            )}
          </div>
        ) : (
          <>
            <span className={styles.iconWrap} aria-hidden="true">
              {resolvedIcon}
            </span>
            {layout !== "icon-only" && (
              <span className={styles.triggerText}>{resolvedTriggerText}</span>
            )}
            {showFileName && (
              <span className={styles.fileName}>{selectedFileText}</span>
            )}
          </>
        )}
      </label>
    </div>
  );
}

export default UploadField;
