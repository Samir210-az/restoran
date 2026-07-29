/**
 * Butun API cavablari ucun ortaq zarf (envelope) formati.
 * Hem admin-panel, hem customer-app eyni formati gozleyir.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
