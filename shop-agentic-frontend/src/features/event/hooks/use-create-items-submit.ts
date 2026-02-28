import { useCallback } from "react";
import { SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../../../app/route-config";
import { getEventStepMeta } from "../constants/event-step-flow";
import { CreateItemsFormValues } from "../types/create-items-types";

export const useCreateItemsSubmit =
  (): SubmitHandler<CreateItemsFormValues> => {
    const navigate = useNavigate();
    const stepMeta = getEventStepMeta(APP_PATHS.createEventItems);

    return useCallback<SubmitHandler<CreateItemsFormValues>>(() => {
      if (stepMeta.nextPath) {
        navigate(stepMeta.nextPath);
      }
    }, [navigate, stepMeta.nextPath]);
  };
