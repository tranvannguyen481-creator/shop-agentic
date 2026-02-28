import {
  CREATE_EVENT_TEMPLATE_FIELDS,
  CREATE_EVENT_TEMPLATE_REQUIRED_FIELDS,
  CREATE_EVENT_TEMPLATE_SAMPLE_VALUES,
  CreateEventTemplateField,
} from "../constants/create-event-template-constants";

interface ParseTemplateUploadResult {
  rowRecord?: Partial<Record<CreateEventTemplateField, string>>;
  error?: string;
}

export const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
};

export const buildTemplateCsvText = () => {
  const headerLine = CREATE_EVENT_TEMPLATE_FIELDS.join(",");
  const sampleLine = CREATE_EVENT_TEMPLATE_FIELDS.map(
    (field) => CREATE_EVENT_TEMPLATE_SAMPLE_VALUES[field],
  ).join(",");

  return `${headerLine}\n${sampleLine}\n`;
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

  const headers = parseCsvLine(lines[0]);
  const firstRow = parseCsvLine(lines[1]);

  if (!headers.length || !firstRow.length) {
    return {
      error: "Template format is invalid.",
    };
  }

  const rowRecord: Partial<Record<CreateEventTemplateField, string>> = {};

  headers.forEach((header, index) => {
    const normalizedKey = header.trim() as CreateEventTemplateField;

    if (CREATE_EVENT_TEMPLATE_FIELDS.includes(normalizedKey)) {
      rowRecord[normalizedKey] = firstRow[index]?.trim() ?? "";
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

  return {
    rowRecord,
  };
};
