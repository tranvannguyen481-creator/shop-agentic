import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Textarea } from "..";
import styles from "./index.module.scss";

interface ImportantNotesModalProps {
  open: boolean;
  initialNotes?: string[];
  onCancel: () => void;
  onSave: (notes: string[]) => void;
}

function ImportantNotesModal({
  open,
  initialNotes = [],
  onCancel,
  onSave,
}: ImportantNotesModalProps) {
  const normalizedInitialNotes = useMemo(
    () => (initialNotes.length > 0 ? initialNotes : [""]),
    [initialNotes],
  );

  const [notes, setNotes] = useState<string[]>(normalizedInitialNotes);

  useEffect(() => {
    if (open) {
      setNotes(normalizedInitialNotes);
    }
  }, [open, normalizedInitialNotes]);

  const handleChange = (index: number, value: string) => {
    setNotes((previous) =>
      previous.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  };

  const handleRemove = (index: number) => {
    setNotes((previous) => {
      const next = previous.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const handleAdd = () => {
    setNotes((previous) => [...previous, ""]);
  };

  const handleSave = () => {
    const cleaned = notes.map((note) => note.trim()).filter(Boolean);
    onSave(cleaned);
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Important Notes"
      footer={
        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Notes
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <p className={styles.helper}>
          Add notes that buyers should see before placing orders.
        </p>

        {notes.map((note, index) => (
          <div className={styles.noteBlock} key={`note-${index}`}>
            <div className={styles.noteHeader}>
              <strong>Note {index + 1}</strong>
              <Button
                type="button"
                variant="text"
                className={styles.removeBtn}
                onClick={() => handleRemove(index)}
                disabled={notes.length === 1}
                aria-label={`Remove note ${index + 1}`}
              >
                Remove
              </Button>
            </div>

            <Textarea
              label=""
              value={note}
              onChange={(event) => handleChange(index, event.target.value)}
              placeholder="Write important details for buyers..."
              rows={3}
              wrapperClassName={styles.noteField}
            />
          </div>
        ))}

        <Button
          type="button"
          variant="text"
          className={styles.addBtn}
          onClick={handleAdd}
        >
          + Add another note
        </Button>
      </div>
    </Modal>
  );
}

export default ImportantNotesModal;
