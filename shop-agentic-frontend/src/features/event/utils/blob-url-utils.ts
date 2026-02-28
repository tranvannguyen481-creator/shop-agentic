export const isBlobPreviewUrl = (
  value: string | null | undefined,
): value is string => Boolean(value && value.startsWith("blob:"));

export const revokeBlobPreviewUrl = (value: string | null | undefined) => {
  if (isBlobPreviewUrl(value)) {
    URL.revokeObjectURL(value);
  }
};

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to generate image preview."));
    };

    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
