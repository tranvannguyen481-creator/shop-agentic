import { useCallback, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CREATE_EVENT_TEMPLATE_FIELDS } from "../constants/create-event-template-constants";
import { CREATE_ITEMS_DRAFT_STORAGE_KEY } from "../constants/create-items-constants";
import { CreateEventFormValues } from "../types/create-event-types";
import { ItemFormValue } from "../types/create-items-types";
import {
  buildTemplateCsvText,
  parseTemplateUpload,
} from "../utils/create-event-template-utils";

interface UseCreateEventTemplateResult {
  templateMessage: string;
  handleDownloadTemplate: () => void;
  handleTemplateUpload: (files: FileList | null) => void;
}

const saveItemsDraftFromTemplate = (items: ItemFormValue[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CREATE_ITEMS_DRAFT_STORAGE_KEY,
      JSON.stringify({ items, bannerPreviewUrls: [] }),
    );
  } catch {

  }
};

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
        file.type === "text/csv" ||
        file.type === "text/plain" ||
        file.name.toLowerCase().endsWith(".csv") ||
        file.name.toLowerCase().endsWith(".txt");

      if (!isCsvFile) {
        setTemplateMessage(
          "Please upload the .csv file downloaded from the template.",
        );
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

        if (parsedResult.items && parsedResult.items.length > 0) {
          saveItemsDraftFromTemplate(parsedResult.items);
          const itemCount = parsedResult.items.length;
          setTemplateMessage(
            `Template uploaded successfully. Event info has been filled and ${itemCount} item${itemCount > 1 ? "s" : ""} with options have been loaded. Submit this form to proceed to the items step.`,
          );
        } else {
          setTemplateMessage(
            "Template uploaded successfully. Event info has been filled. Submit this form to continue.",
          );
        }
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
