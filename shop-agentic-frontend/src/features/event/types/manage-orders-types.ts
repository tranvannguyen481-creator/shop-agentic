import { ManageOrdersData } from "../utils/fetch-manage-orders-data";

export interface ManageOrdersViewModel {
  eventId: string;
  isLoading: boolean;
  data: ManageOrdersData | null;
  hasOrders: boolean;
  isCloseOrderModalOpen: boolean;
  isDeleteModalOpen: boolean;
  infoMessage: string | null;
  handleEditEvent: () => void;
  handleOpenCloseOrderModal: () => void;
  handleCloseCloseOrderModal: () => void;
  handleConfirmCloseOrder: () => void;
  handleOpenDeleteModal: () => void;
  handleCloseDeleteModal: () => void;
  handleConfirmDelete: () => void;
  handleBroadcast: () => void;
  handleExportOrders: () => void;
}
