import { AlertCircle, CheckCircle, Loader2, Users } from "lucide-react";
import { Button, Modal } from "../../../../shared/components/ui";
import styles from "./index.module.scss";

interface JoinGroupRequestModalProps {
  open: boolean;
  groupName: string;
  status: "idle" | "loading" | "sent" | "error";
  errorMessage: string | null;
  onRequestJoin: () => void;
  onBack: () => void;
}

function JoinGroupRequestModal({
  open,
  groupName,
  status,
  errorMessage,
  onRequestJoin,
  onBack,
}: JoinGroupRequestModalProps) {
  const isPending = status === "loading";
  const isSent = status === "sent";
  const isError = status === "error";

  return (
    <Modal open={open} title={<h3 className={styles.title}>Tham gia nhóm</h3>}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Users size={40} className={styles.icon} />
        </div>

        <p className={styles.groupName}>{groupName}</p>

        {isSent ? (
          <div className={styles.sentBlock}>
            <CheckCircle size={20} className={styles.sentIcon} />
            <p className={styles.sentText}>
              Yêu cầu của bạn đã được gửi!
              <br />
              <span className={styles.sentSub}>
                Vui lòng chờ chủ nhóm duyệt để tham gia nhóm.
              </span>
            </p>
          </div>
        ) : (
          <p className={styles.description}>
            Bạn chưa là thành viên của nhóm này. Gửi yêu cầu tham gia để có thể
            xem và đặt hàng trong sự kiện.
          </p>
        )}

        {isError && errorMessage ? (
          <div className={styles.errorBlock}>
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <div className={styles.actions}>
          {!isSent ? (
            <Button
              variant="primary"
              className={styles.joinBtn}
              disabled={isPending}
              onClick={onRequestJoin}
            >
              {isPending ? (
                <>
                  <Loader2 size={15} className={styles.spinner} />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Users size={15} />
                  Gửi yêu cầu tham gia
                </>
              )}
            </Button>
          ) : null}

          <Button variant="outline" className={styles.backBtn} onClick={onBack}>
            Quay lại
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default JoinGroupRequestModal;
