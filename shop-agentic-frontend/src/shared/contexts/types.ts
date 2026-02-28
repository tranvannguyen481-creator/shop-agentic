export type WizardMode = "create" | "edit";

export interface WizardState {
  flowKey: string;
  currentStepPath: string;
  mode: WizardMode;
  resourceId: string;
}
