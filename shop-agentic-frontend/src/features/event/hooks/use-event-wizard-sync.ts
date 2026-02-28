import { useEffect } from "react";
import { useWizard, WizardMode } from "../../../shared/contexts";
import { EventCreationStepPath } from "../constants/event-step-flow";

interface UseEventWizardSyncParams {
  currentStepPath: EventCreationStepPath;
  mode?: WizardMode;
  resourceId?: string;
}

export const useEventWizardSync = ({
  currentStepPath,
  mode,
  resourceId,
}: UseEventWizardSyncParams) => {
  const { wizard, setWizardState } = useWizard();
  const resolvedMode =
    mode ?? (wizard.flowKey === "event" ? wizard.mode : "create");
  const resolvedResourceId =
    resourceId ?? (wizard.flowKey === "event" ? wizard.resourceId : "");

  useEffect(() => {
    if (
      wizard.flowKey === "event" &&
      wizard.currentStepPath === currentStepPath &&
      wizard.mode === resolvedMode &&
      wizard.resourceId === resolvedResourceId
    ) {
      return;
    }

    setWizardState({
      flowKey: "event",
      currentStepPath,
      mode: resolvedMode,
      resourceId: resolvedResourceId,
    });
  }, [
    currentStepPath,
    resolvedMode,
    resolvedResourceId,
    setWizardState,
    wizard.currentStepPath,
    wizard.flowKey,
    wizard.mode,
    wizard.resourceId,
  ]);
};
