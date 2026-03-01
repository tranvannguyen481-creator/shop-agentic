import { Check, Inbox, X } from "lucide-react";
import { Alert, SectionCard } from "../../../../shared/components/ui";
import type { JoinRequestItem } from "../../../../shared/services/group-api";
import styles from "./index.module.scss";

interface JoinRequestsSectionProps {
  items: JoinRequestItem[];
  isLoading: boolean;
  error: string | null;
  approvingId: string | null;
  rejectingId: string | null;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const toRelativeTime = (timestamp: number): string => {
  if (!timestamp) return "";
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
};

function JoinRequestsSection({
  items,
  isLoading,
  error,
  approvingId,
  rejectingId,
  onApprove,
  onReject,
}: JoinRequestsSectionProps) {
  if (isLoading) return null;
  if (error) {
    return (
      <SectionCard>
        <Alert tone="error">{error}</Alert>
      </SectionCard>
    );
  }

  const pendingCount = items.length;

  return (
    <SectionCard className={styles.section}>
      <h3 className={styles.title}>
        Join requests
        {pendingCount > 0 ? (
          <span className={styles.badge}>{pendingCount}</span>
        ) : null}
      </h3>

      {pendingCount === 0 ? (
        <div className={styles.empty}>
          <Inbox size={28} className={styles.emptyIcon} />
          <span>No pending join requests</span>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((req) => {
            const initial = (req.displayName || req.email || "?")
              .charAt(0)
              .toUpperCase();

            const isBusy = approvingId === req.id || rejectingId === req.id;

            return (
              <div key={req.id} className={styles.requestCard}>
                <span className={styles.avatar}>{initial}</span>

                <div className={styles.info}>
                  <span className={styles.name}>
                    {req.displayName || "Unknown user"}
                  </span>
                  <span className={styles.email}>{req.email}</span>
                  {req.createdAt ? (
                    <span className={styles.time}>
                      {toRelativeTime(req.createdAt)}
                    </span>
                  ) : null}
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.approveBtn}
                    title="Approve"
                    disabled={isBusy}
                    onClick={() => onApprove(req.id)}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.rejectBtn}
                    title="Reject"
                    disabled={isBusy}
                    onClick={() => onReject(req.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export default JoinRequestsSection;
