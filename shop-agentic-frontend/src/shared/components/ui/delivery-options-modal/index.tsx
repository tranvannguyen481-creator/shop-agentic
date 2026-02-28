import { CalendarDays, Clock3, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, DateTimePicker, Input, Modal } from "..";
import styles from "./index.module.scss";

export interface DeliveryFeeItem {
  name: string;
  fee: string;
}

interface DeliveryOptionsModalProps {
  open: boolean;
  initialDate?: string;
  initialFromTime?: string;
  initialToTime?: string;
  initialFees?: DeliveryFeeItem[];
  onCancel: () => void;
  onSave: (payload: {
    date: string;
    fromTime: string;
    toTime: string;
    fees: DeliveryFeeItem[];
  }) => void;
}

function DeliveryOptionsModal({
  open,
  initialDate = "",
  initialFromTime = "",
  initialToTime = "",
  initialFees = [],
  onCancel,
  onSave,
}: DeliveryOptionsModalProps) {
  const normalizedInitialFees = useMemo(
    () =>
      initialFees.length > 0
        ? initialFees
        : [
            {
              name: "",
              fee: "",
            },
          ],
    [initialFees],
  );

  const [date, setDate] = useState(initialDate);
  const [fromTime, setFromTime] = useState(initialFromTime);
  const [toTime, setToTime] = useState(initialToTime);
  const [fees, setFees] = useState<DeliveryFeeItem[]>(normalizedInitialFees);

  const isTimeRangeInvalid = Boolean(fromTime && toTime && fromTime >= toTime);

  const cleanedFees = useMemo(
    () =>
      fees
        .map((item) => ({ name: item.name.trim(), fee: item.fee.trim() }))
        .filter((item) => item.name && item.fee),
    [fees],
  );

  const isSaveDisabled = !date || !fromTime || !toTime || isTimeRangeInvalid;

  useEffect(() => {
    if (open) {
      setDate(initialDate);
      setFromTime(initialFromTime);
      setToTime(initialToTime);
      setFees(normalizedInitialFees);
    }
  }, [
    open,
    initialDate,
    initialFromTime,
    initialToTime,
    normalizedInitialFees,
  ]);

  const handleFeeChange = (
    index: number,
    key: keyof DeliveryFeeItem,
    value: string,
  ) => {
    setFees((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const handleAddFee = () => {
    setFees((previous) => [...previous, { name: "", fee: "" }]);
  };

  const handleRemoveFee = (index: number) => {
    setFees((previous) => {
      const next = previous.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [{ name: "", fee: "" }];
    });
  };

  const handleSave = () => {
    if (isSaveDisabled) {
      return;
    }

    onSave({
      date,
      fromTime,
      toTime,
      fees: cleanedFees,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={
        <div className={styles.modalHeader}>
          <h3>Schedule Delivery</h3>
          <p>
            Choose a delivery date, set available time range, and configure
            fees.
          </p>
        </div>
      }
      bodyClassName={styles.modalBody}
      footer={
        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={onCancel}>
            <X size={16} /> Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className={styles.okBtn}
            disabled={isSaveDisabled}
          >
            <Save size={16} /> Save Delivery Options
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <section className={styles.scheduleSection}>
          <div className={styles.sectionTitle}>
            <CalendarDays aria-hidden="true" />
            <span>Delivery Date</span>
          </div>

          <DateTimePicker
            label=""
            type="date"
            wrapperClassName={styles.dateField}
            inputProps={{
              value: date,
              onChange: (event) => setDate(event.target.value),
            }}
          />
        </section>

        <section className={styles.scheduleSection}>
          <div className={styles.sectionTitle}>
            <Clock3 aria-hidden="true" />
            <span>Delivery Window</span>
          </div>

          <div className={styles.timeRow}>
            <DateTimePicker
              label="From"
              type="time"
              wrapperClassName={styles.timeField}
              inputProps={{
                value: fromTime,
                onChange: (event) => setFromTime(event.target.value),
              }}
            />

            <span className={styles.separator}>to</span>

            <DateTimePicker
              label="To"
              type="time"
              wrapperClassName={styles.timeField}
              inputProps={{
                value: toTime,
                onChange: (event) => setToTime(event.target.value),
              }}
            />
          </div>

          {isTimeRangeInvalid && (
            <p className={styles.validationText}>
              End time must be later than start time.
            </p>
          )}
        </section>

        <section className={styles.feesBox}>
          <h4>Delivery Fee Options</h4>

          <div className={styles.feesList}>
            {fees.map((item, index) => (
              <div className={styles.feeRow} key={`delivery-fee-${index}`}>
                <span className={styles.index}>{index + 1}</span>
                <Input
                  label=""
                  placeholder={`Option name ${index + 1}`}
                  value={item.name}
                  onChange={(event) =>
                    handleFeeChange(index, "name", event.target.value)
                  }
                  wrapperClassName={styles.feeName}
                />

                <span className={styles.currency}>$</span>
                <Input
                  label=""
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={item.fee}
                  onChange={(event) =>
                    handleFeeChange(index, "fee", event.target.value)
                  }
                  wrapperClassName={styles.feeValue}
                />

                <Button
                  type="button"
                  variant="text"
                  className={styles.removeBtn}
                  onClick={() => handleRemoveFee(index)}
                  aria-label={`Remove delivery option ${index + 1}`}
                >
                  <Trash2 aria-hidden="true" /> <span>Remove</span>
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="text"
            className={styles.addBtn}
            onClick={handleAddFee}
          >
            <Plus aria-hidden="true" />
            Add more
          </Button>

          {cleanedFees.length === 0 && (
            <p className={styles.helperText}>
              Add at least one delivery fee option if applicable.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}

export default DeliveryOptionsModal;
