import { SubmitHandler, UseFormReturn } from "react-hook-form";
import {
  CreateEventFormValues,
  DeliveryOptionsPayload,
  ExternalUrlPayload,
} from "./create-event-types";

export interface CreateEventPageViewModel {
  form: UseFormReturn<CreateEventFormValues>;
  isGroupGateLoading: boolean;
  isGroupGateBlocking: boolean;
  groupGateError: string | null;
  groupOptions: Array<{ label: string; value: string }>;
  templateMessage: string;
  handleSubmit: SubmitHandler<CreateEventFormValues>;
  handleTemplateUpload: (files: FileList | null) => void;
  handleDownloadTemplate: () => void;
  isImportantNotesModalOpen: boolean;
  isExternalUrlModalOpen: boolean;
  isDeliveryOptionsModalOpen: boolean;
  importantNotes: string[];
  externalUrlFieldName: string;
  externalUrl: string;
  deliveryScheduleDate: string;
  deliveryTimeFrom: string;
  deliveryTimeTo: string;
  deliveryFees: DeliveryOptionsPayload["fees"];
  handleImportantNotesToggle: (checked: boolean) => void;
  handleExternalUrlToggle: (checked: boolean) => void;
  handleDeliveryOptionsToggle: (checked: boolean) => void;
  handleCancelImportantNotes: () => void;
  handleSaveImportantNotes: (notes: string[]) => void;
  handleCancelExternalUrl: () => void;
  handleSaveExternalUrl: (payload: ExternalUrlPayload) => void;
  handleCancelDeliveryOptions: () => void;
  handleSaveDeliveryOptions: (payload: DeliveryOptionsPayload) => void;
  onGoToCreateGroup: () => void;
}
