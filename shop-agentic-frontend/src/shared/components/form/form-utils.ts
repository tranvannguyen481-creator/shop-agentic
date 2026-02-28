import { FieldErrors, FieldValues, UseFormReturn } from "react-hook-form";

const parsePixelValue = (rawValue: string) => {
  const parsedValue = Number.parseFloat(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const getFirstErrorPath = (errors: FieldErrors): string | null => {
  const walk = (node: unknown, currentPath = ""): string | null => {
    if (!node || typeof node !== "object") {
      return null;
    }

    const typedNode = node as Record<string, unknown>;
    if ("message" in typedNode || "type" in typedNode) {
      return currentPath || null;
    }

    for (const key of Object.keys(typedNode)) {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      const foundPath = walk(typedNode[key], nextPath);

      if (foundPath) {
        return foundPath;
      }
    }

    return null;
  };

  return walk(errors);
};

const escapeSelectorValue = (value: string) => {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, "\\$&");
};

export const scrollToFirstError = (
  errors: FieldErrors,
  offset = 140,
  focusField?: (path: string) => void,
) => {
  const firstErrorPath = getFirstErrorPath(errors);

  if (!firstErrorPath) {
    return;
  }

  focusField?.(firstErrorPath);

  window.setTimeout(() => {
    const escapedPath = escapeSelectorValue(firstErrorPath);
    const fieldElement = document.querySelector(
      `[name="${escapedPath}"]`,
    ) as HTMLElement | null;

    if (!fieldElement) {
      return;
    }

    const style = window.getComputedStyle(fieldElement);
    const headerHeight = parsePixelValue(
      style.getPropertyValue("--app-header-height"),
    );
    const tabsHeight = parsePixelValue(
      style.getPropertyValue("--app-tabs-height"),
    );
    const smartOffset =
      headerHeight > 0 || tabsHeight > 0
        ? headerHeight + tabsHeight + 20
        : offset;

    const fieldPosition = fieldElement.getBoundingClientRect().top;
    const targetTop = Math.max(0, fieldPosition + window.scrollY - smartOffset);

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });

    fieldElement.focus({ preventScroll: true });
  }, 10);
};

export const mergeServerErrors = <TFormValues extends FieldValues>(
  form: UseFormReturn<TFormValues>,
  serverErrors: Record<string, string>,
) => {
  Object.entries(serverErrors).forEach(([field, message]) => {
    form.setError(field as never, {
      type: "server",
      message,
    });
  });
};
