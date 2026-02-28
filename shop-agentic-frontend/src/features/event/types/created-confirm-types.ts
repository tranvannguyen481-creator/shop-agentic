export interface ConfirmItemRow {
  name: string;
  price: string;
}

export interface CreatedConfirmViewModel {
  // draft data
  title: string;
  closingDate: string;
  collectionDate: string;
  collectionTime: string;
  pickupLocation: string;
  adminFee: string;
  mode: string;
  items: ConfirmItemRow[];
  hasDraft: boolean;
  // publish modal
  isPublishModalOpen: boolean;
  isPublishing: boolean;
  publishError: string | null;
  handleOpenPublishModal: () => void;
  handleClosePublishModal: () => void;
  handlePublish: () => void;
}
