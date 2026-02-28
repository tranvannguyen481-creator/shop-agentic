import { useCallback, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CREATE_EVENT_TEMPLATE_FIELDS } from "../constants/create-event-template-constants";
import { CreateEventFormValues } from "../types/create-event-types";
import {
  buildTemplateCsvText,
  parseTemplateUpload,
} from "../utils/create-event-template-utils";

interface UseCreateEventTemplateResult {
  templateMessage: string;
  handleDownloadTemplate: () => void;
  handleTemplateUpload: (files: FileList | null) => void;
}

export const useCreateEventTemplate = (
  form: UseFormReturn<CreateEventFormValues>,
): UseCreateEventTemplateResult => {
  const [templateMessage, setTemplateMessage] = useState("");

  const templateFileName = useMemo(() => {
    const dateText = new Date().toISOString().slice(0, 10);
    return `create-event-template-${dateText}.csv`;
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    const templateText = buildTemplateCsvText();
    const blob = new Blob([templateText], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = templateFileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [templateFileName]);

  const handleTemplateUpload = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];

      if (!file) {
        setTemplateMessage("");
        return;
      }

      const isCsvFile =
        file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");

      if (!isCsvFile) {
        setTemplateMessage("Please upload a .csv file from the template.");
        return;
      }

      void file.text().then((rawText) => {
        const parsedResult = parseTemplateUpload(rawText);

        if (parsedResult.error) {
          setTemplateMessage(parsedResult.error);
          return;
        }

        const rowRecord = parsedResult.rowRecord ?? {};

        CREATE_EVENT_TEMPLATE_FIELDS.forEach((field) => {
          const value = rowRecord[field];

          if (value !== undefined && value !== "") {
            form.setValue(field, value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
          }
        });

        setTemplateMessage(
          "Template uploaded. Required fields have been filled.",
        );
      });
    },
    [form],
  );

  return {
    templateMessage,
    handleDownloadTemplate,
    handleTemplateUpload,
  };
};
