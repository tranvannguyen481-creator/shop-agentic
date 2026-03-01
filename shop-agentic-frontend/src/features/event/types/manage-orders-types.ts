export interface ManageOrdersData {
  title: string;
  closingDate: string;
  collectionDate: string;
  closingInText: string;
  deliveryInText: string;
  buyCount: number;
  totalPurchase: string;
  adminFee: string;
}

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
