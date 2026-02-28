import { useCallback, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  CreateEventFormValues,
  DeliveryOptionsPayload,
  ExternalUrlPayload,
} from "../types/create-event-types";

export interface UseCreateEventModalsResult {
  isImportantNotesModalOpen: boolean;
  isExternalUrlModalOpen: boolean;
  isDeliveryOptionsModalOpen: boolean;
  handleImportantNotesToggle: (checked: boolean) => void;
  handleExternalUrlToggle: (checked: boolean) => void;
  handleDeliveryOptionsToggle: (checked: boolean) => void;
  handleCancelImportantNotes: () => void;
  handleSaveImportantNotes: (notes: string[]) => void;
  handleCancelExternalUrl: () => void;
  handleSaveExternalUrl: (payload: ExternalUrlPayload) => void;
  handleCancelDeliveryOptions: () => void;
  handleSaveDeliveryOptions: (payload: DeliveryOptionsPayload) => void;
}

export const useCreateEventModals = (
  form: UseFormReturn<CreateEventFormValues>,
): UseCreateEventModalsResult => {
  const [isImportantNotesModalOpen, setIsImportantNotesModalOpen] =
    useState(false);
  const [isExternalUrlModalOpen, setIsExternalUrlModalOpen] = useState(false);
  const [isDeliveryOptionsModalOpen, setIsDeliveryOptionsModalOpen] =
    useState(false);

  const handleImportantNotesToggle = useCallback((checked: boolean) => {
    setIsImportantNotesModalOpen(checked);
  }, []);

  const handleExternalUrlToggle = useCallback((checked: boolean) => {
    setIsExternalUrlModalOpen(checked);
  }, []);

  const handleDeliveryOptionsToggle = useCallback((checked: boolean) => {
    setIsDeliveryOptionsModalOpen(checked);
  }, []);

  const handleCancelImportantNotes = () => {
    form.setValue("addImportantNotes", false, { shouldDirty: true });
    form.setValue("importantNotes", [], { shouldDirty: true });
    setIsImportantNotesModalOpen(false);
  };

  const handleSaveImportantNotes = (notes: string[]) => {
    form.setValue("importantNotes", notes, { shouldDirty: true });
    setIsImportantNotesModalOpen(false);
  };

  const handleCancelExternalUrl = () => {
    form.setValue("addExternalUrl", false, { shouldDirty: true });
    form.setValue("externalUrlFieldName", "", { shouldDirty: true });
    form.setValue("externalUrl", "", { shouldDirty: true });
    setIsExternalUrlModalOpen(false);
  };

  const handleSaveExternalUrl = (payload: ExternalUrlPayload) => {
    form.setValue("addExternalUrl", true, { shouldDirty: true });
    form.setValue("externalUrlFieldName", payload.fieldName, {
      shouldDirty: true,
    });
    form.setValue("externalUrl", payload.url, { shouldDirty: true });
    setIsExternalUrlModalOpen(false);
  };

  const handleCancelDeliveryOptions = () => {
    form.setValue("addDeliveryOptions", false, { shouldDirty: true });
    form.setValue("deliveryScheduleDate", "", { shouldDirty: true });
    form.setValue("deliveryTimeFrom", "", { shouldDirty: true });
    form.setValue("deliveryTimeTo", "", { shouldDirty: true });
    form.setValue("deliveryFees", [], { shouldDirty: true });
    setIsDeliveryOptionsModalOpen(false);
  };

  const handleSaveDeliveryOptions = (payload: DeliveryOptionsPayload) => {
    form.setValue("addDeliveryOptions", true, { shouldDirty: true });
    form.setValue("deliveryScheduleDate", payload.date, { shouldDirty: true });
    form.setValue("deliveryTimeFrom", payload.fromTime, { shouldDirty: true });
    form.setValue("deliveryTimeTo", payload.toTime, { shouldDirty: true });
    form.setValue("deliveryFees", payload.fees, { shouldDirty: true });
    setIsDeliveryOptionsModalOpen(false);
  };

  return {
    isImportantNotesModalOpen,
    isExternalUrlModalOpen,
    isDeliveryOptionsModalOpen,
    handleImportantNotesToggle,
    handleExternalUrlToggle,
    handleDeliveryOptionsToggle,
    handleCancelImportantNotes,
    handleSaveImportantNotes,
    handleCancelExternalUrl,
    handleSaveExternalUrl,
    handleCancelDeliveryOptions,
    handleSaveDeliveryOptions,
  };
};
