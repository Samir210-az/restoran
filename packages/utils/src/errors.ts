/**
 * Butun tetbiq boyu istifade olunacaq ortaq xeta sinifi.
 * Edge Function-larda ve client-de eyni format ile tutulur ki,
 * loglama ve istifadeciye gosterme ardicil olsun.
 */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "TENANT_MISMATCH"
  | "RATE_LIMITED"
  | "AI_PROVIDER_ERROR"
  | "PAYMENT_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON() {
    return {
      success: false as const,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  TENANT_MISMATCH: 403,
  RATE_LIMITED: 429,
  AI_PROVIDER_ERROR: 502,
  PAYMENT_ERROR: 402,
  INTERNAL_ERROR: 500,
};

export function createError(code: ErrorCode, message: string, details?: unknown): AppError {
  return new AppError(code, message, STATUS_BY_CODE[code], details);
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
