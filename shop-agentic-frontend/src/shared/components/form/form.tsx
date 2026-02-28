import { ReactNode } from "react";
import {
  FieldErrors,
  FieldValues,
  FormProvider,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import { RequiredFieldsProvider } from "./required-fields-context";

type FormWithRequiredFields<TFormValues extends FieldValues> =
  UseFormReturn<TFormValues> & {
    __requiredFieldPaths?: Set<string>;
  };

interface FormProps<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
  onInvalid?: SubmitErrorHandler<TFormValues>;
  invalidScrollOffset?: number;
  className?: string;
  children: ReactNode;
}

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

function Form<TFormValues extends FieldValues>({
  form,
  onSubmit,
  onInvalid,
  invalidScrollOffset,
  className,
  children,
}: FormProps<TFormValues>) {
  const requiredFieldPaths = (form as FormWithRequiredFields<TFormValues>)
    .__requiredFieldPaths;

  const handleInvalid: SubmitErrorHandler<TFormValues> = (errors) => {
    const firstErrorPath = getFirstErrorPath(errors);

    if (firstErrorPath) {
      form.setFocus(firstErrorPath as never);

      window.setTimeout(() => {
        const escapedPath = escapeSelectorValue(firstErrorPath);
        const fieldElement = document.querySelector(
          `[name="${escapedPath}"]`,
        ) as HTMLElement | null;

        if (!fieldElement) {
          onInvalid?.(errors);
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
          invalidScrollOffset ??
          (headerHeight > 0 || tabsHeight > 0
            ? headerHeight + tabsHeight + 20
            : 120);

        const fieldPosition = fieldElement.getBoundingClientRect().top;
        const targetTop = Math.max(
          0,
          fieldPosition + window.scrollY - smartOffset,
        );

        window.scrollTo({
          top: targetTop,
          behavior: "smooth",
        });

        fieldElement.focus({ preventScroll: true });
      }, 10);
    }

    onInvalid?.(errors);
  };

  return (
    <FormProvider {...form}>
      <RequiredFieldsProvider value={requiredFieldPaths ?? null}>
        <form
          className={className}
          onSubmit={form.handleSubmit(onSubmit, handleInvalid)}
          noValidate
        >
          {children}
        </form>
      </RequiredFieldsProvider>
    </FormProvider>
  );
}

export default Form;
