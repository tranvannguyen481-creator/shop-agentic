import styles from "./index.module.scss";

export interface StepItem {
  label: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  className?: string;
}

function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol className={`${styles.stepper} ${className ?? ""}`.trim()}>
      {steps.map((step, index) => {
        const stepIndex = index + 1;
        const done = stepIndex < currentStep;
        const active = stepIndex === currentStep;

        return (
          <li
            key={step.label}
            className={`${done ? styles.done : ""} ${active ? styles.active : ""}`}
          >
            <span>{stepIndex}</span>
            <p>{step.label}</p>
          </li>
        );
      })}
    </ol>
  );
}

export default Stepper;
