/**
 * Error Handling Middleware
 * - AppError class for typed, operational errors
 * - asyncHandler to wrap async route handlers
 * - Global error handler with dev/prod detail levels
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

// ── Custom Error Class ──────────────────────────────────────────

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }

    // ── Factory Methods ───────────────────────────────────────────

    static badRequest(message: string, code = 'BAD_REQUEST') {
        return new AppError(message, 400, code);
    }

    static unauthorized(message: string, code = 'UNAUTHORIZED') {
        return new AppError(message, 401, code);
    }

    static notFound(message: string, code = 'NOT_FOUND') {
        return new AppError(message, 404, code);
    }

    static internal(message: string, code = 'INTERNAL_ERROR') {
        return new AppError(message, 500, code, false);
    }
}

// ── Async Handler Wrapper ───────────────────────────────────────

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wraps async route handlers so thrown errors are forwarded to Express error handler.
 * Eliminates the need for try/catch in every route.
 */
export function asyncHandler(fn: AsyncRouteHandler): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// ── Global Error Handler ────────────────────────────────────────

const isDev = process.env.NODE_ENV !== 'production';

export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    // Determine status code and message
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
    const message = err instanceof AppError && err.isOperational
        ? err.message
        : 'Internal Server Error';

    // Always log the full error in dev
    if (isDev || statusCode >= 500) {
        console.error(`💥 [${code}] ${err.message}`);
        if (isDev) console.error(err.stack);
    }

    const response: Record<string, unknown> = {
        success: false,
        error: message,
        code,
    };

    // Include stack trace in dev mode for debugging
    if (isDev) {
        response.stack = err.stack;
        // For non-AppError, include the original message too
        if (!(err instanceof AppError)) {
            response.originalError = err.message;
        }
    }

    res.status(statusCode).json(response);
}
