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

// Choices format inside a column: "OptionName:ExtraPrice;OptionName2:ExtraPrice2"
// Extra price = 0 means no surcharge. Use semicolon (;) to separate choices within a group.
// Up to 3 option groups per item are supported.
export const CREATE_EVENT_ITEM_SAMPLE_ROWS: Array<
  Record<CreateEventItemTemplateField, string>
> = [
  {
    // Has 2 option groups: Size (required, 3 choices with price) + Packaging (optional, 2 choices)
    itemName: "Organic Apples (1kg)",
    itemDescription: "Fresh and crispy Fuji apples",
    itemPrice: "8.50",
    itemOptionGroup1Name: "Size",
    itemOptionGroup1Required: "yes",
    itemOptionGroup1Choices: "Small:0;Medium:1.00;Large:2.00",
    itemOptionGroup2Name: "Packaging",
    itemOptionGroup2Required: "no",
    itemOptionGroup2Choices: "Gift wrap:0.50;Standard bag:0",
    itemOptionGroup3Name: "",
    itemOptionGroup3Required: "",
    itemOptionGroup3Choices: "",
  },
  {
    // Has 1 option group: Bundle size (required)
    itemName: "Fresh Spinach",
    itemDescription: "Garden-fresh leafy greens",
    itemPrice: "3.00",
    itemOptionGroup1Name: "Bundle",
    itemOptionGroup1Required: "yes",
    itemOptionGroup1Choices: "250g:0;500g:2.50;1kg:5.00",
    itemOptionGroup2Name: "",
    itemOptionGroup2Required: "",
    itemOptionGroup2Choices: "",
    itemOptionGroup3Name: "",
    itemOptionGroup3Required: "",
    itemOptionGroup3Choices: "",
  },
  {
    // No options – plain item
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
