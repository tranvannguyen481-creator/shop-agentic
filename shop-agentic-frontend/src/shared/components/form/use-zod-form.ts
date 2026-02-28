import { zodResolver } from "@hookform/resolvers/zod";
import {
  FieldValues,
  Resolver,
  UseFormProps,
  UseFormReturn,
  useForm,
} from "react-hook-form";
import { z } from "zod";

const isRequiredSchema = (schema: z.ZodTypeAny) =>
  !schema.safeParse(undefined).success;

const getObjectShape = (
  schema: z.ZodTypeAny,
): Record<string, z.ZodTypeAny> | null => {
  const typedSchema = schema as unknown as {
    shape?: Record<string, z.ZodTypeAny>;
    _def?: {
      shape?:
        | (() => Record<string, z.ZodTypeAny>)
        | Record<string, z.ZodTypeAny>;
    };
  };

  if (schema instanceof z.ZodObject && typedSchema.shape) {
    return typedSchema.shape;
  }

  if (typedSchema._def?.shape) {
    return typeof typedSchema._def.shape === "function"
      ? typedSchema._def.shape()
      : typedSchema._def.shape;
  }

  return null;
};

const collectRequiredFieldPaths = (
  schema: z.ZodTypeAny,
  parentPath = "",
): Set<string> => {
  const requiredPaths = new Set<string>();
  const shape = getObjectShape(schema);

  if (!shape) {
    return requiredPaths;
  }

  for (const [fieldName, fieldSchema] of Object.entries(shape)) {
    const fieldPath = parentPath ? `${parentPath}.${fieldName}` : fieldName;
    const required = isRequiredSchema(fieldSchema);

    if (required) {
      requiredPaths.add(fieldPath);
    }

    if (required) {
      const nestedPaths = collectRequiredFieldPaths(fieldSchema, fieldPath);
      nestedPaths.forEach((path) => requiredPaths.add(path));
    }
  }

  return requiredPaths;
};

type FormWithRequiredFields<TFormValues extends FieldValues> =
  UseFormReturn<TFormValues> & {
    __requiredFieldPaths?: Set<string>;
  };

interface UseZodFormOptions<TFormValues extends FieldValues> extends Omit<
  UseFormProps<TFormValues>,
  "resolver"
> {}

export function useZodForm<TFormValues extends FieldValues>(
  schema: z.ZodTypeAny,
  options?: UseZodFormOptions<TFormValues>,
): UseFormReturn<TFormValues> {
  const form = useForm<TFormValues>({
    mode: "onTouched",
    shouldFocusError: true,
    ...options,
    resolver: zodResolver(schema as never) as Resolver<TFormValues>,
  });

  (form as FormWithRequiredFields<TFormValues>).__requiredFieldPaths =
    collectRequiredFieldPaths(schema);

  return form;
}
