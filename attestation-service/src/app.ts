import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import { generalLimiter } from './middleware/rateLimiter';
import attestationRoutes from './modules/attestation/attestation.routes';
import { isContractConfigured } from './config/blockchain';
import pool from './config/database';

const app = express();
const PORT = parseInt(process.env.PORT || '3002');

// ─── Security ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
}));
app.use(generalLimiter);
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/v1', attestationRoutes);

// ─── Health Check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'attestation-service',
        version: '1.0.0',
        blockchain: {
            attestationRegistry: isContractConfigured(),
        },
        llmMode: process.env.LLM_MOCK_MODE === 'true' ? 'mock' : 'live',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ─── Startup ─────────────────────────────────────────────────
const start = async () => {
    // Verify database connectivity
    try {
        await pool.query('SELECT 1');
        console.log('  PostgreSQL connected');
    } catch (err: any) {
        console.error('  PostgreSQL connection failed:', err.message);
    }

    // Check contract configuration
    if (isContractConfigured()) {
        console.log('  AttestationRegistry contract configured');
    } else {
        console.warn('  AttestationRegistry contract NOT configured — on-chain features disabled');
    }

    app.listen(PORT, () => {
        console.log('═══════════════════════════════════════════════════════');
        console.log('  Attestation Service');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`  Port:     ${PORT}`);
        console.log(`  Env:      ${process.env.NODE_ENV || 'development'}`);
        console.log(`  LLM Mode: ${process.env.LLM_MOCK_MODE === 'true' ? 'MOCK' : 'LIVE (Gemini)'}`);
        console.log('═══════════════════════════════════════════════════════');
    });
};

start();
