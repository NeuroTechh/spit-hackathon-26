import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { generalLimiter } from './middleware/rateLimiter';
import { isContractConfigured } from './blockchain/contracts';

// ─── Import Routes ───────────────────────────────────────────
import userRoutes from './modules/user/user.routes';
import identityRoutes from './modules/identity/identity.routes';
import credentialRoutes from './modules/credential/credential.routes';
import reputationRoutes from './modules/reputation/reputation.routes';
import eventRoutes from './modules/event/event.routes';
import verificationRoutes from './modules/verification/verification.routes';

// ─── Create Express App ─────────────────────────────────────

const app = express();

// ─── Security Middleware ─────────────────────────────────────

app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(generalLimiter);

// ─── Mount Routes ────────────────────────────────────────────

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/identity', identityRoutes);
app.use('/api/v1/credentials', credentialRoutes);
app.use('/api/v1/reputation', reputationRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/verify', verificationRoutes);

// ─── Health Check ────────────────────────────────────────────

app.get('/health', (req, res) => {
    const contracts = isContractConfigured();
    res.json({
        status: 'ok',
        version: '1.0.0',
        platform: 'RacePass',
        blockchain: contracts,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ─── 404 Handler ─────────────────────────────────────────────

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ─── Error Handler ───────────────────────────────────────────

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001');

const start = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  RacePass — Production Backend');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);

    // Check database connectivity
    try {
        const db = await import('./config/database');
        await db.query('SELECT 1');
        console.log('  ✅ PostgreSQL connected');
    } catch (err: any) {
        console.warn(`  ⚠️  PostgreSQL: ${err.message}`);
    }

    // Check Redis connectivity
    try {
        const redis = await import('./config/redis');
        await redis.default.ping();
        console.log('  ✅ Redis connected');
    } catch (err: any) {
        console.warn(`  ⚠️  Redis: ${err.message}`);
    }

    // Check contract configuration
    const contracts = isContractConfigured();
    console.log(`  Contracts:`);
    console.log(`    CredentialRegistry: ${contracts.credentialRegistry ? '✅' : '⚠️  not configured'}`);
    console.log(`    EventPassNFT:      ${contracts.eventPassNFT ? '✅' : '⚠️  not configured'}`);
    console.log(`    ReputationRegistry: ${contracts.reputationRegistry ? '✅' : '⚠️  not configured'}`);

    app.listen(PORT, () => {
        console.log('═══════════════════════════════════════════════════════');
        console.log(`  Server running on port ${PORT}`);
        console.log(`  API base: http://localhost:${PORT}/api/v1`);
        console.log('═══════════════════════════════════════════════════════');
    });
};

start();

export default app;
