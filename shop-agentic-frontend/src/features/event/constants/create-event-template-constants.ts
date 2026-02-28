export const CREATE_EVENT_TEMPLATE_FIELDS = [
  "mode",
  "title",
  "closingDate",
  "collectionDate",
  "collectionTime",
  "description",
  "pickupLocation",
  "adminFee",
] as const;

export const CREATE_EVENT_ITEM_TEMPLATE_FIELDS = [
  "itemName",
  "itemDescription",
  "itemPrice",
  "itemOptionGroup1Name",
  "itemOptionGroup1Required",
  "itemOptionGroup1Choices",
  "itemOptionGroup2Name",
  "itemOptionGroup2Required",
  "itemOptionGroup2Choices",
  "itemOptionGroup3Name",
  "itemOptionGroup3Required",
  "itemOptionGroup3Choices",
] as const;

export const CREATE_TEMPLATE_ALL_FIELDS = [
  ...CREATE_EVENT_TEMPLATE_FIELDS,
  ...CREATE_EVENT_ITEM_TEMPLATE_FIELDS,
] as const;

export const CREATE_EVENT_TEMPLATE_REQUIRED_FIELDS = [
  "mode",
  "title",
  "closingDate",
  "collectionDate",
  "collectionTime",
] as const;

export type CreateEventTemplateField =
  (typeof CREATE_EVENT_TEMPLATE_FIELDS)[number];

export type CreateEventItemTemplateField =
  (typeof CREATE_EVENT_ITEM_TEMPLATE_FIELDS)[number];

export const CREATE_EVENT_TEMPLATE_SAMPLE_VALUES: Record<
  CreateEventTemplateField,
  string
> = {
  mode: "group-buy",
  title: "Weekend Fresh Produce",
  closingDate: "2026-03-10",
  collectionDate: "2026-03-12",
  collectionTime: "18:30",
  description: "Seasonal fruits and vegetables from local farms",
  pickupLocation: "Blk 123 Community Center",
  adminFee: "0.0",
};

export const CREATE_EVENT_ITEM_SAMPLE_ROWS: Array<
  Record<CreateEventItemTemplateField, string>
> = [
  {
    itemName: "Organic Apples (1kg)",
    itemDescription: "Fresh and crispy Fuji apples",
    itemPrice: "8.50",
    itemOptionGroup1Name: "Size",
    itemOptionGroup1Required: "yes",
    itemOptionGroup1Choices: "Small:0;Medium:0;Large:0",
    itemOptionGroup2Name: "Pack",
    itemOptionGroup2Required: "no",
    itemOptionGroup2Choices: "Gift wrap:0.50;No wrap:0",
    itemOptionGroup3Name: "",
    itemOptionGroup3Required: "",
    itemOptionGroup3Choices: "",
  },
  {
    itemName: "Fresh Spinach (250g)",
    itemDescription: "Garden-fresh leafy greens",
    itemPrice: "3.00",
    itemOptionGroup1Name: "",
    itemOptionGroup1Required: "",
    itemOptionGroup1Choices: "",
    itemOptionGroup2Name: "",
    itemOptionGroup2Required: "",
    itemOptionGroup2Choices: "",
    itemOptionGroup3Name: "",
    itemOptionGroup3Required: "",
    itemOptionGroup3Choices: "",
  },
  {
    itemName: "Sweet Carrots (500g)",
    itemDescription: "Tender baby carrots",
    itemPrice: "2.50",
    itemOptionGroup1Name: "",
    itemOptionGroup1Required: "",
    itemOptionGroup1Choices: "",
    itemOptionGroup2Name: "",
    itemOptionGroup2Required: "",
    itemOptionGroup2Choices: "",
    itemOptionGroup3Name: "",
    itemOptionGroup3Required: "",
    itemOptionGroup3Choices: "",
  },
];
