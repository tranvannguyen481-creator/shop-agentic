import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { WizardMode, WizardState } from "./types";

interface WizardContextValue {
  wizard: WizardState;
  setWizardState: (nextState: Partial<WizardState>) => void;
  resetWizardState: () => void;
}

const DEFAULT_WIZARD_STATE: WizardState = {
  flowKey: "",
  currentStepPath: "",
  mode: "create",
  resourceId: "",
};

const WizardContext = createContext<WizardContextValue | null>(null);

interface WizardProviderProps {
  children: ReactNode;
}

export function WizardProvider({ children }: WizardProviderProps) {
  const [wizard, setWizard] = useState<WizardState>(DEFAULT_WIZARD_STATE);

  const value = useMemo<WizardContextValue>(
    () => ({
      wizard,
      setWizardState: (nextState) => {
        setWizard((previousState) => ({
          ...previousState,
          ...nextState,
        }));
      },
      resetWizardState: () => {
        setWizard(DEFAULT_WIZARD_STATE);
      },
    }),
    [wizard],
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);

  if (!context) {
    throw new Error("useWizard must be used within WizardProvider");
  }

  return context;
}

export type { WizardMode };
