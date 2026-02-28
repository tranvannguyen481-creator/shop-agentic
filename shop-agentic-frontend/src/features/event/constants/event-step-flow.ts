import { APP_PATHS } from "../../../app/route-config";

export const EVENT_CREATION_CANCEL_PATH = APP_PATHS.listMyEvents;

export const EVENT_CREATION_STEP_PATHS = [
  APP_PATHS.createEvent,
  APP_PATHS.createEventItems,
  APP_PATHS.createdConfirm,
] as const;

export type EventCreationStepPath = (typeof EVENT_CREATION_STEP_PATHS)[number];

interface EventStepMeta {
  isFirstStep: boolean;
  leftLabel: "Cancel" | "Previous";
  rightLabel: "Next" | "Confirm";
  leftPath: string;
  nextPath?: string;
}

export const getEventStepMeta = (
  currentPath: EventCreationStepPath,
): EventStepMeta => {
  const currentIndex = EVENT_CREATION_STEP_PATHS.indexOf(currentPath);
  const lastStepIndex = EVENT_CREATION_STEP_PATHS.length - 1;

  if (currentIndex <= 0) {
    return {
      isFirstStep: true,
      leftLabel: "Cancel",
      rightLabel: "Next",
      leftPath: EVENT_CREATION_CANCEL_PATH,
      nextPath: EVENT_CREATION_STEP_PATHS[1],
    };
  }

  if (currentIndex >= lastStepIndex) {
    return {
      isFirstStep: false,
      leftLabel: "Previous",
      rightLabel: "Confirm",
      leftPath: EVENT_CREATION_STEP_PATHS[lastStepIndex - 1],
      nextPath: EVENT_CREATION_CANCEL_PATH,
    };
  }

  return {
    isFirstStep: false,
    leftLabel: "Previous",
    rightLabel: "Next",
    leftPath: EVENT_CREATION_STEP_PATHS[currentIndex - 1],
    nextPath: EVENT_CREATION_STEP_PATHS[currentIndex + 1],
  };
};
