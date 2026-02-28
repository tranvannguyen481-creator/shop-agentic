import { CircleMinus, CirclePlus } from "lucide-react";
import { APP_PATHS } from "../../../../app/route-config";
import {
  Alert,
  Avatar,
  Button,
  Modal,
  SectionCard,
} from "../../../../shared/components/ui";
import { useCreatedConfirm } from "../../hooks/use-created-confirm";
import EventStepNavigation from "../event-step-navigation";
import styles from "./index.module.scss";

function CreatedConfirmView() {
  const viewModel = useCreatedConfirm();

  return (
    <section className={styles.page}>
      <SectionCard className={styles.eventCard}>
        <div className={styles.eventHead}>
          <div className={styles.sellerWrap}>
            <Avatar name="Truong Thanh Trung" size={40} />
            <div>
              <p className={styles.sellerName}>Truong Thanh Trung</p>
              <p className={styles.sellerMeta}>Shop Agentic GroupBuy</p>
            </div>
          </div>
          <div className={styles.buyWrap}>
            <small>2 hours left</small>
            <Button type="button" className={styles.buyChip}>
              0 BUY
            </Button>
          </div>
        </div>

        <h2 className={styles.eventTitle}>test</h2>

        <dl className={styles.metaList}>
          <div>
            <dt>Closing:</dt>
            <dd>27-02-2026</dd>
          </div>
          <div>
            <dt>Collection:</dt>
            <dd>05-03-2026</dd>
          </div>
          <div>
            <dt>Address:</dt>
            <dd>-</dd>
          </div>
        </dl>
      </SectionCard>

      <div className={styles.itemList}>
        <SectionCard className={styles.itemRow}>
          <div>
            <p className={styles.itemName}>test</p>
            <p className={styles.itemPrice}>$0</p>
          </div>

          <div className={styles.qtyWrap}>
            <Button type="button" variant="text" className={styles.qtyBtn}>
              <CircleMinus size={20} />
            </Button>
            <strong>0</strong>
            <Button type="button" variant="text" className={styles.qtyBtn}>
              <CirclePlus size={20} />
            </Button>
          </div>
        </SectionCard>
      </div>

      <section className={styles.totalPanel}>
        <p className={styles.totalValue}>$0.00</p>
        <p className={styles.feeText}>Admin Fee: $0.00</p>
      </section>

      <EventStepNavigation
        currentPath={APP_PATHS.createdConfirm}
        className={styles.actions}
        onNextClick={viewModel.handleOpenPublishModal}
      />

      <Modal
        open={viewModel.isPublishModalOpen}
        onClose={viewModel.handleClosePublishModal}
        title="Publish Event"
        bodyClassName={styles.publishModalBody}
        footer={
          <div className={styles.publishModalActions}>
            <Button
              type="button"
              variant="outline"
              onClick={viewModel.handleClosePublishModal}
              disabled={viewModel.isPublishing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={viewModel.handlePublish}
              disabled={viewModel.isPublishing}
            >
              {viewModel.isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        }
      >
        <p className={styles.publishModalText}>
          Confirm publish event? This will clear all draft data in create-event
          process.
        </p>

        {viewModel.publishError ? (
          <Alert tone="error" className={styles.publishError}>
            {viewModel.publishError}
          </Alert>
        ) : null}
      </Modal>
    </section>
  );
}

export default CreatedConfirmView;
