/**
 * Custom application error class.
 * Dùng trong toàn bộ service/controller thay vì tạo Error thủ công.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    errorCode = "INTERNAL_ERROR",
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    // Đảm bảo instanceof hoạt động đúng với TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(message = "Not found"): AppError {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }

  static validationError(message: string, details?: unknown): AppError {
    return new AppError(message, 422, "VALIDATION_ERROR", details);
  }
}
