/**
 * FinalForm Server Entry Point
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/firebase';
import shopifyRoutes from './routes/shopify';
import capiRoutes from './routes/capi';
import googleSheetsRoutes from './routes/googleSheets';
import { globalErrorHandler } from './middleware/errorHandler';

dotenv.config({ path: process.argv.includes('--dev') ? '.env.development' : '.env' });

const app = express();
const port = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// ── CORS ────────────────────────────────────────────────────────

const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://finalformfunnel.web.app',
    'https://finalformfunnel.firebaseapp.com',
    'https://finalformfunnel-beta.web.app',
    'https://finalformfunnel-beta.firebaseapp.com',
    process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        // ALWAYS allow all in development or when no origin is present (e.g. server-to-server)
        callback(null, true);
    },
    credentials: true,
}));

// Handle preflight requests
app.options('*', cors());

// ── Body Parsing ────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request Logging ─────────────────────────────────────────────

app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, url } = req;

    console.log(`➡️  ${method} ${url}`);

    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
        const bodyPreview = JSON.stringify(req.body).substring(0, 200);
        console.log(`   📦 Body: ${bodyPreview}${bodyPreview.length >= 200 ? '...' : ''}`);
    }

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const icon = status >= 400 ? '❌' : '✅';
        console.log(`${icon} ${method} ${url} → ${status} (${duration}ms)`);
    });

    next();
});

// ── Health Check ────────────────────────────────────────────────

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), port });
});

// ── Routes ──────────────────────────────────────────────────────

app.use('/webhook/shopify', shopifyRoutes);
app.use('/webhook/capi', capiRoutes);
app.use('/webhook/google-sheets', googleSheetsRoutes);

// ── Global Error Handler ────────────────────────────────────────
// Must be registered AFTER routes

app.use(globalErrorHandler);

// ── Process-Level Error Handling ────────────────────────────────

process.on('unhandledRejection', (reason) => {
    console.error('🔴 Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('🔴 Uncaught Exception:', err);
});

// ── Start ───────────────────────────────────────────────────────

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📡 Health check: http://localhost:${port}/health`);
    if (isDev) console.log(`🔗 Allowed origins:`, allowedOrigins);
});
