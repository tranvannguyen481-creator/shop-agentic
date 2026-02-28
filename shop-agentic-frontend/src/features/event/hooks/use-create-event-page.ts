import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { useSmartForm } from "../../../shared/components/form";
import { useWizard } from "../../../shared/contexts";
import { fetchMyGroups } from "../../../shared/services/group-api";
import { CREATE_EVENT_DEFAULT_VALUES } from "../constants/create-event-constants";
import { CREATE_ITEMS_DRAFT_STORAGE_KEY } from "../constants/create-items-constants";
import { getEventStepMeta } from "../constants/event-step-flow";
import { createEventSchema } from "../schemas/create-event-schema";
import { CreateEventPageViewModel } from "../types/create-event-page-types";
import { CreateEventFormValues } from "../types/create-event-types";
import {
  getStoredCreateEventDraft,
  saveCreateEventDraft,
} from "../utils/create-event-draft-storage";
import { fetchEventEditDraft } from "../utils/fetch-event-edit-draft";
import { useCreateEventModals } from "./use-create-event-modals";
import { useCreateEventTemplate } from "./use-create-event-template";

interface UseCreateEventPageOptions {
  mode?: "create" | "edit";
}

const GROUP_GATE_PAGE = 1;
const GROUP_GATE_PAGE_SIZE = 100;

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
      saveCreateEventDraft(values as CreateEventFormValues);
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

    saveCreateEventDraft(nextValues);

    if (typeof window !== "undefined") {
      try {
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
  const modals = useCreateEventModals(form);

  const importantNotes = form.watch("importantNotes");
  const externalUrlFieldName = form.watch("externalUrlFieldName");
  const externalUrl = form.watch("externalUrl");
  const deliveryScheduleDate = form.watch("deliveryScheduleDate");
  const deliveryTimeFrom = form.watch("deliveryTimeFrom");
  const deliveryTimeTo = form.watch("deliveryTimeTo");
  const deliveryFees = form.watch("deliveryFees");

  const handleSubmit = (values: CreateEventFormValues) => {
    saveCreateEventDraft(values);

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
    ...modals,
    importantNotes,
    externalUrlFieldName,
    externalUrl,
    deliveryScheduleDate,
    deliveryTimeFrom,
    deliveryTimeTo,
    deliveryFees,
    onGoToCreateGroup: () => navigate(APP_PATHS.listMyGroups),
  };
};
