import { AlertCircle } from "lucide-react";
import { FieldError } from "react-hook-form";

interface FormErrorProps {
  error?: FieldError;
}

function FormError({ error }: FormErrorProps) {
  if (!error?.message) {
    return null;
  }

  return (
    <div
      className="invalid-feedback d-block mt-1 d-flex align-items-center gap-1 text-danger"
      role="alert"
    >
      <AlertCircle size={16} />
      <span>{String(error.message)}</span>
    </div>
  );
}

export default FormError;
