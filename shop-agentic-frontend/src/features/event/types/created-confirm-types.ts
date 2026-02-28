export interface CreatedConfirmViewModel {
  isPublishModalOpen: boolean;
  isPublishing: boolean;
  publishError: string | null;
  handleOpenPublishModal: () => void;
  handleClosePublishModal: () => void;
  handlePublish: () => void;
}
