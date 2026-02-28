export interface ConfirmItemOption {
  value: string;
}

export interface ConfirmItemOptionGroupChoice {
  id: string;
  name: string;
  price: number;
}

export interface ConfirmItemOptionGroup {
  name: string;
  required: boolean;
  choices: ConfirmItemOptionGroupChoice[];
}

export interface ConfirmItemRow {
  name: string;
  price: string;
  imagePreviewUrl: string | null;
  options: ConfirmItemOption[];
  optionGroups: ConfirmItemOptionGroup[];
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
  bannerPreviewUrls: string[];
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
