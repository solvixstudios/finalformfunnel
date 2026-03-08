/**
 * Input Validation Middleware
 * Reusable middleware factories for request validation
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Validates that required fields exist in req.body.
 * Returns 400 with a clear message listing missing fields.
 */
export function requireBody(...fields: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const missing = fields.filter(f => {
            const val = req.body[f];
            return val === undefined || val === null || val === '';
        });

        if (missing.length > 0) {
            throw AppError.badRequest(
                `Missing required fields: ${missing.join(', ')}`,
                'MISSING_FIELDS'
            );
        }
        next();
    };
}

/**
 * Validates that required fields exist in req.query.
 * Returns 400 with a clear message listing missing fields.
 */
export function requireQuery(...fields: string[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const missing = fields.filter(f => {
            const val = req.query[f];
            return val === undefined || val === null || val === '';
        });

        if (missing.length > 0) {
            throw AppError.badRequest(
                `Missing required query params: ${missing.join(', ')}`,
                'MISSING_PARAMS'
            );
        }
        next();
    };
}
