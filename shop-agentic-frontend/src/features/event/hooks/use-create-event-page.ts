import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { useSmartForm } from "../../../shared/components/form";
import { useWizard } from "../../../shared/contexts";
import { fetchMyGroups } from "../../../shared/services/group-api";
import {
  CREATE_EVENT_DEFAULT_VALUES,
  CREATE_EVENT_DRAFT_STORAGE_KEY,
} from "../constants/create-event-constants";
import { CREATE_ITEMS_DRAFT_STORAGE_KEY } from "../constants/create-items-constants";
import { getEventStepMeta } from "../constants/event-step-flow";
import { createEventSchema } from "../schemas/create-event-schema";
import { CreateEventPageViewModel } from "../types/create-event-page-types";
import {
  CreateEventFormValues,
  DeliveryOptionsPayload,
  ExternalUrlPayload,
} from "../types/create-event-types";
import { fetchEventEditDraft } from "../utils/fetch-event-edit-draft";
import { useCreateEventTemplate } from "./use-create-event-template";

interface UseCreateEventPageOptions {
  mode?: "create" | "edit";
}

const GROUP_GATE_PAGE = 1;
const GROUP_GATE_PAGE_SIZE = 100;

const getStoredCreateEventDraft = (): Partial<CreateEventFormValues> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawDraft = window.localStorage.getItem(
      CREATE_EVENT_DRAFT_STORAGE_KEY,
    );

    if (!rawDraft) {
      return {};
    }

    const parsedDraft = JSON.parse(rawDraft) as Partial<CreateEventFormValues>;

    return {
      ...parsedDraft,
      uploadExcel: null,
    };
  } catch {
    return {};
  }
};

const toPersistedDraft = (
  values: CreateEventFormValues,
): Omit<CreateEventFormValues, "uploadExcel"> & { uploadExcel: null } => ({
  ...values,
  uploadExcel: null,
});

export const useCreateEventPage = (
  options?: UseCreateEventPageOptions,
): CreateEventPageViewModel => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { wizard } = useWizard();
  const appliedDraftIdRef = useRef<string | null>(null);

  const isEditMode =
    options?.mode === "edit" ||
    (wizard.flowKey === "event" && wizard.mode === "edit");
  const editEventId = isEditMode
    ? wizard.resourceId || (searchParams.get("id")?.trim() ?? "")
    : "";

  const initialDraftValues = useMemo(getStoredCreateEventDraft, []);

  // Modal state (replacing Redux modal state)
  const [isImportantNotesModalOpen, setIsImportantNotesModalOpen] =
    useState(false);
  const [isExternalUrlModalOpen, setIsExternalUrlModalOpen] = useState(false);
  const [isDeliveryOptionsModalOpen, setIsDeliveryOptionsModalOpen] =
    useState(false);

  const {
    data: groupsData,
    isLoading: isGroupsLoading,
    error: groupsError,
  } = useQuery({
    queryKey: ["myGroups", GROUP_GATE_PAGE, GROUP_GATE_PAGE_SIZE],
    queryFn: () => fetchMyGroups(GROUP_GATE_PAGE, GROUP_GATE_PAGE_SIZE),
  });

  const groupOptions = useMemo(
    () =>
      (groupsData?.items ?? []).map((group) => ({
        label: String(group.name ?? "Untitled group"),
        value: group.id,
      })),
    [groupsData?.items],
  );

  const userGroupCount = groupsData?.items.length ?? 0;

  const form = useSmartForm<CreateEventFormValues>({
    schema: createEventSchema,
    defaultValues: {
      ...CREATE_EVENT_DEFAULT_VALUES,
      ...initialDraftValues,
    },
  });

  useEffect(() => {
    if (isEditMode || groupOptions.length === 0) {
      return;
    }

    const selectedGroupId = String(form.getValues("groupId") ?? "").trim();
    if (selectedGroupId) {
      return;
    }

    form.setValue("groupId", groupOptions[0].value, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [form, groupOptions, isEditMode]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        window.localStorage.setItem(
          CREATE_EVENT_DRAFT_STORAGE_KEY,
          JSON.stringify(toPersistedDraft(values as CreateEventFormValues)),
        );
      } catch {
        // Ignore storage write failures.
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const { data: editDraftData } = useQuery({
    queryKey: ["eventEditDraft", editEventId],
    queryFn: () => fetchEventEditDraft(editEventId),
    enabled: isEditMode && !!editEventId,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (!editDraftData || !editEventId) {
      return;
    }

    if (appliedDraftIdRef.current === editEventId) {
      return;
    }

    appliedDraftIdRef.current = editEventId;

    const nextValues: CreateEventFormValues = {
      ...CREATE_EVENT_DEFAULT_VALUES,
      ...editDraftData.createEventDraft,
      uploadExcel: null,
    };

    form.reset(nextValues);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          CREATE_EVENT_DRAFT_STORAGE_KEY,
          JSON.stringify(toPersistedDraft(nextValues)),
        );

        if (editDraftData.createItemsDraft) {
          window.localStorage.setItem(
            CREATE_ITEMS_DRAFT_STORAGE_KEY,
            JSON.stringify(editDraftData.createItemsDraft),
          );
        }
      } catch {
        // Ignore storage write failures.
      }
    }
  }, [editDraftData, editEventId, form]);

  const stepMeta = getEventStepMeta(APP_PATHS.createEvent);
  const { templateMessage, handleDownloadTemplate, handleTemplateUpload } =
    useCreateEventTemplate(form);

  const importantNotes = form.watch("importantNotes");
  const externalUrlFieldName = form.watch("externalUrlFieldName");
  const externalUrl = form.watch("externalUrl");
  const deliveryScheduleDate = form.watch("deliveryScheduleDate");
  const deliveryTimeFrom = form.watch("deliveryTimeFrom");
  const deliveryTimeTo = form.watch("deliveryTimeTo");
  const deliveryFees = form.watch("deliveryFees");

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

  const handleSubmit = (values: CreateEventFormValues) => {
    try {
      window.localStorage.setItem(
        CREATE_EVENT_DRAFT_STORAGE_KEY,
        JSON.stringify(toPersistedDraft(values)),
      );
    } catch {
      // Ignore storage write failures and continue navigation.
    }

    if (stepMeta.nextPath) {
      navigate(stepMeta.nextPath);
    }
  };

  const isGroupGateBlocking =
    !isEditMode && !isGroupsLoading && !groupsError && userGroupCount === 0;

  return {
    form,
    isGroupGateLoading: !isEditMode && isGroupsLoading,
    isGroupGateBlocking,
    groupGateError: !isEditMode
      ? groupsError
        ? groupsError instanceof Error
          ? groupsError.message
          : "Failed to load groups"
        : null
      : null,
    groupOptions,
    templateMessage,
    handleSubmit,
    handleTemplateUpload,
    handleDownloadTemplate,
    isImportantNotesModalOpen,
    isExternalUrlModalOpen,
    isDeliveryOptionsModalOpen,
    importantNotes,
    externalUrlFieldName,
    externalUrl,
    deliveryScheduleDate,
    deliveryTimeFrom,
    deliveryTimeTo,
    deliveryFees,
    handleImportantNotesToggle,
    handleExternalUrlToggle,
    handleDeliveryOptionsToggle,
    handleCancelImportantNotes,
    handleSaveImportantNotes,
    handleCancelExternalUrl,
    handleSaveExternalUrl,
    handleCancelDeliveryOptions,
    handleSaveDeliveryOptions,
    onGoToCreateGroup: () => navigate(APP_PATHS.listMyGroups),
  };
};
