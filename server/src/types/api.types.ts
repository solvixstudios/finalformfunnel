/**
 * API Response Types
 * Standardized envelope for all API responses
 */

export interface ApiSuccess<T = unknown> {
    success: true;
    data: T;
}

export interface ApiError {
    success: false;
    error: string;
    code?: string;
    details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/** Helper to create success responses */
export function ok<T>(data: T): ApiSuccess<T> {
    return { success: true, data };
}

/** Helper to create error responses */
export function fail(error: string, code?: string, details?: unknown): ApiError {
    const response: ApiError = { success: false, error };
    if (code) response.code = code;
    if (details) response.details = details;
    return response;
}
