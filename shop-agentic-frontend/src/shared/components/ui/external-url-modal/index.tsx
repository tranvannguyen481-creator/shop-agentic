import { Link, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Input, Modal } from "..";
import styles from "./index.module.scss";

interface ExternalUrlModalProps {
  open: boolean;
  initialFieldName?: string;
  initialUrl?: string;
  onCancel: () => void;
  onSave: (payload: { fieldName: string; url: string }) => void;
}

function ExternalUrlModal({
  open,
  initialFieldName = "",
  initialUrl = "",
  onCancel,
  onSave,
}: ExternalUrlModalProps) {
  const [fieldName, setFieldName] = useState(initialFieldName);
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    if (open) {
      setFieldName(initialFieldName);
      setUrl(initialUrl);
    }
  }, [open, initialFieldName, initialUrl]);

  const handleSave = () => {
    onSave({ fieldName: fieldName.trim(), url: url.trim() });
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Add External URL"
      footer={
        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={onCancel}>
            <X size={16} /> Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!url.trim()}>
            <Link size={16} /> Save Link
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <p className={styles.helper}>
          Add a custom link for buyers, such as product page, spreadsheet, or
          reference document.
        </p>

        <Input
          label="Field Name"
          placeholder="e.g. Product Source"
          value={fieldName}
          onChange={(event) => setFieldName(event.target.value)}
          wrapperClassName={styles.field}
        />

        <Input
          label="External URL"
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          wrapperClassName={styles.field}
          required
        />
      </div>
    </Modal>
  );
}

export default ExternalUrlModal;
