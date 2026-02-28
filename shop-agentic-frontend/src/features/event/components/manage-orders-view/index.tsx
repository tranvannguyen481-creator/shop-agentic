import { Bell, ClipboardList, Link2, Megaphone, Trash2 } from "lucide-react";
import SearchBar from "../../../../shared/components/search-bar";
import {
  Alert,
  Avatar,
  Button,
  EmptyState,
  Modal,
  SectionCard,
  Skeleton,
} from "../../../../shared/components/ui";
import { ManageOrdersViewModel } from "../../types/manage-orders-types";
import styles from "./index.module.scss";

interface ManageOrdersViewProps {
  viewModel: ManageOrdersViewModel;
}

function ManageOrdersView({ viewModel }: ManageOrdersViewProps) {
  const title = viewModel.data?.title ?? "test";
  const closingDate = viewModel.data?.closingDate ?? "27-02-2026";
  const collectionDate = viewModel.data?.collectionDate ?? "05-03-2026";
  const closingInText = viewModel.data?.closingInText ?? "closing in 2 hours";
  const deliveryInText = viewModel.data?.deliveryInText ?? "Delivery in 6 days";
  const buyCount = viewModel.data?.buyCount ?? 0;
  const totalPurchase = viewModel.data?.totalPurchase ?? "$0.00";
  const adminFee = viewModel.data?.adminFee ?? "$0.00";

  return (
    <section className={styles.page} data-event-id={viewModel.eventId}>
      <section className={styles.eventSummary}>
        <div className={styles.eventLeft}>
          <Avatar name="Truong Thanh Trung" size={38} />
          <div>
            <h2 className={styles.eventTitle}>{title}</h2>
            <p className={styles.eventMeta}>Closing: {closingDate}</p>
            <p className={styles.eventMeta}>Collection: {collectionDate}</p>
          </div>
        </div>

        <div className={styles.eventRight}>
          <p className={styles.eventTime}>{closingInText}</p>
          <p className={styles.eventTime}>{deliveryInText}</p>
          <Button type="button" className={styles.buyChip}>
            {buyCount} BUY
          </Button>
          <p className={styles.hostActions}>RE-HOST&nbsp;&nbsp;SHARE</p>
        </div>
      </section>

      {viewModel.infoMessage ? (
        <Alert tone="info">{viewModel.infoMessage}</Alert>
      ) : null}

      <div className={styles.topActions}>
        <Button
          type="button"
          variant="outline"
          className={styles.actionChip}
          onClick={viewModel.handleEditEvent}
        >
          Edit Event
        </Button>
        <Button
          type="button"
          variant="outline"
          className={styles.actionChip}
          onClick={viewModel.handleBroadcast}
        >
          Broadcast
        </Button>
        <Button
          type="button"
          variant="outline"
          className={styles.actionChip}
          onClick={viewModel.handleOpenCloseOrderModal}
        >
          Close Order
        </Button>
        <Button
          type="button"
          variant="outline"
          className={styles.actionChip}
          onClick={viewModel.handleExportOrders}
        >
          Export Orders
        </Button>
      </div>

      <SearchBar
        placeholder="Search Name / Mobile Number / Order Reference"
        ariaLabel="Search orders"
      />

      {viewModel.isLoading ? (
        <SectionCard className={styles.loadingCard}>
          <Skeleton height={22} width="40%" />
          <Skeleton height={16} width="75%" />
          <Skeleton height={16} width="66%" />
          <div className={styles.loadingActions}>
            <Skeleton height={36} />
            <Skeleton height={36} />
          </div>
        </SectionCard>
      ) : null}

      {viewModel.hasOrders ? (
        <>
          <p className={styles.helper}>
            Click on Names for Order Details and on <Link2 size={14} /> for
            Payment Details.
          </p>

          <SectionCard className={styles.totalPanel}>
            <p>Total Purchase: {totalPurchase}</p>
            <p>Admin Fee: {adminFee}</p>
          </SectionCard>
        </>
      ) : (
        <SectionCard className={styles.emptyPanel}>
          <EmptyState
            icon={<ClipboardList />}
            title="Chưa có đơn hàng nào"
            description="Broadcast sự kiện để mời buyer tham gia và bắt đầu nhận đơn hàng."
            actions={
              <Button type="button" onClick={viewModel.handleBroadcast}>
                <Megaphone size={16} />
                Broadcast to invite buyers
              </Button>
            }
          />
        </SectionCard>
      )}

      <Button type="button" variant="outline" className={styles.exitButton}>
        Exit
      </Button>

      <Button
        type="button"
        variant="text"
        className={styles.deleteButton}
        onClick={viewModel.handleOpenDeleteModal}
      >
        <Trash2 size={14} />
        DELETE
      </Button>

      <Modal
        open={viewModel.isCloseOrderModalOpen}
        onClose={viewModel.handleCloseCloseOrderModal}
        title="Close Order"
        footer={
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="outline"
              onClick={viewModel.handleCloseCloseOrderModal}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={viewModel.handleConfirmCloseOrder}
            >
              <Bell size={14} />
              Confirm Close
            </Button>
          </div>
        }
      >
        <p className={styles.modalText}>
          You are about to close this order. Buyers will no longer be able to
          place new orders.
        </p>
      </Modal>

      <Modal
        open={viewModel.isDeleteModalOpen}
        onClose={viewModel.handleCloseDeleteModal}
        title="Delete Event"
        footer={
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="outline"
              onClick={viewModel.handleCloseDeleteModal}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={viewModel.handleConfirmDelete}
            >
              <Trash2 size={14} />
              Confirm Delete
            </Button>
          </div>
        }
      >
        <p className={styles.modalText}>
          This action is irreversible. Please confirm before deleting the event
          and related order history.
        </p>
      </Modal>
    </section>
  );
}

export default ManageOrdersView;
