import {
  CREATE_EVENT_ITEM_SAMPLE_ROWS,
  CREATE_EVENT_ITEM_TEMPLATE_FIELDS,
  CREATE_EVENT_TEMPLATE_FIELDS,
  CREATE_EVENT_TEMPLATE_REQUIRED_FIELDS,
  CREATE_EVENT_TEMPLATE_SAMPLE_VALUES,
  CreateEventItemTemplateField,
  CreateEventTemplateField,
} from "../constants/create-event-template-constants";
import { ItemFormValue } from "../types/create-items-types";

interface ParseTemplateUploadResult {
  rowRecord?: Partial<Record<CreateEventTemplateField, string>>;
  items?: ItemFormValue[];
  error?: string;
}

/**
 * Split a pipe-separated template line into column values.
 * Pipe (`|`) is used as the column separator to avoid conflicts with commas
 * that may appear naturally inside descriptions, location names, etc.
 */
export const parsePipeLine = (line: string): string[] =>
  line.split("|").map((v) => v.trim());

export const buildTemplateCsvText = () => {
  const SEP = "|";
  const eventFields = [...CREATE_EVENT_TEMPLATE_FIELDS];
  const itemFields = [...CREATE_EVENT_ITEM_TEMPLATE_FIELDS];
  const allFields = [...eventFields, ...itemFields];

  const headerLine = allFields.join(SEP);

  // First data row: event info + first item
  const firstItemRow = CREATE_EVENT_ITEM_SAMPLE_ROWS[0];
  const firstDataLine = [
    ...eventFields.map((field) => CREATE_EVENT_TEMPLATE_SAMPLE_VALUES[field]),
    ...itemFields.map((field) => firstItemRow[field]),
  ].join(SEP);

  // Remaining item rows: event fields blank, only item data
  const additionalItemLines = CREATE_EVENT_ITEM_SAMPLE_ROWS.slice(1).map(
    (itemRow) =>
      [
        ...eventFields.map(() => ""),
        ...itemFields.map((field) => itemRow[field]),
      ].join(SEP),
  );

  return [headerLine, firstDataLine, ...additionalItemLines, ""].join("\n");
};

export const parseTemplateUpload = (
  rawText: string,
): ParseTemplateUploadResult => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      error: "Template is empty. Please fill at least one row.",
    };
  }

  const headers = parsePipeLine(lines[0]);
  const firstDataRow = parsePipeLine(lines[1]);

  if (!headers.length || !firstDataRow.length) {
    return {
      error: "Template format is invalid.",
    };
  }

  // Parse event fields from first data row
  const rowRecord: Partial<Record<CreateEventTemplateField, string>> = {};

  headers.forEach((header, index) => {
    const key = header.trim() as CreateEventTemplateField;

    if (CREATE_EVENT_TEMPLATE_FIELDS.includes(key)) {
      rowRecord[key] = firstDataRow[index]?.trim() ?? "";
    }
  });

  const missingRequiredFields = CREATE_EVENT_TEMPLATE_REQUIRED_FIELDS.filter(
    (field) => !rowRecord[field],
  );

  if (missingRequiredFields.length > 0) {
    return {
      error: `Missing required values: ${missingRequiredFields.join(", ")}`,
    };
  }

  // Parse items from all data rows (rows 2 onwards)
  const items: ItemFormValue[] = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const row = parsePipeLine(lines[rowIndex]);
    const itemRecord: Partial<Record<CreateEventItemTemplateField, string>> =
      {};

    headers.forEach((header, index) => {
      const key = header.trim() as CreateEventItemTemplateField;

      if (CREATE_EVENT_ITEM_TEMPLATE_FIELDS.includes(key)) {
        itemRecord[key] = row[index]?.trim() ?? "";
      }
    });

    if (itemRecord.itemName) {
      // Parse up to 3 option groups
      const optionGroups: Array<{
        id: string;
        name: string;
        required: boolean;
        choices: Array<{ id: string; name: string; price: number }>;
      }> = [];

      for (let g = 1; g <= 3; g += 1) {
        const groupNameKey =
          `itemOptionGroup${g}Name` as CreateEventItemTemplateField;
        const groupRequiredKey =
          `itemOptionGroup${g}Required` as CreateEventItemTemplateField;
        const groupChoicesKey =
          `itemOptionGroup${g}Choices` as CreateEventItemTemplateField;

        const groupName = (itemRecord[groupNameKey] ?? "").trim();
        if (!groupName) continue;

        const required =
          (itemRecord[groupRequiredKey] ?? "").trim().toLowerCase() === "yes";
        const choicesRaw = (itemRecord[groupChoicesKey] ?? "").trim();

        const choices = choicesRaw
          ? choicesRaw.split(";").map((part, ci) => {
              const colonIdx = part.lastIndexOf(":");
              if (colonIdx > 0) {
                const choiceName = part.slice(0, colonIdx).trim();
                const choicePrice = parseFloat(part.slice(colonIdx + 1).trim());
                return {
                  id: `g${g}-c${ci + 1}`,
                  name: choiceName,
                  price: Number.isFinite(choicePrice) ? choicePrice : 0,
                };
              }
              return {
                id: `g${g}-c${ci + 1}`,
                name: part.trim(),
                price: 0,
              };
            })
          : [];

        if (choices.length > 0) {
          optionGroups.push({
            id: `group-${g}`,
            name: groupName,
            required,
            choices,
          });
        }
      }

      items.push({
        imageFile: null,
        imagePreviewUrl: null,
        name: itemRecord.itemName,
        description: itemRecord.itemDescription ?? "",
        price: itemRecord.itemPrice ?? "0",
        options: [],
        optionGroups,
      });
    }
  }

  return {
    rowRecord,
    items: items.length > 0 ? items : undefined,
  };
};
