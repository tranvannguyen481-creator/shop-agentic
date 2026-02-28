import { ItemFormValue } from "../types/create-items-types";

export const createDefaultItem = (): ItemFormValue => ({
  imageFile: null,
  imagePreviewUrl: null,
  name: "",
  description: "",
  price: "0",
  options: [],
  optionGroups: [],
});
