import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth';
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
    origin: true,
    credentials: true,
}));

// ─── Better Auth Handler (must be BEFORE express.json()) ─────

app.all("/api/auth/*", toNodeHandler(auth));

// ─── Body Parser & Rate Limiting ─────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(generalLimiter);

// ─── OAuth/OIDC Discovery Endpoints ─────────────────────────

app.get("/.well-known/openid-configuration", async (req, res) => {
    const baseUrl = process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || '3001'}`;
    res.json({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/api/auth/oauth2/authorize`,
        token_endpoint: `${baseUrl}/api/auth/oauth2/token`,
        jwks_uri: `${baseUrl}/api/auth/jwks`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
    });
});

app.get("/.well-known/oauth-authorization-server", async (req, res) => {
    const baseUrl = process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || '3001'}`;
    res.json({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/api/auth/oauth2/authorize`,
        token_endpoint: `${baseUrl}/api/auth/oauth2/token`,
        jwks_uri: `${baseUrl}/api/auth/jwks`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
    });
});

// ─── Session Info Endpoint ──────────────────────────────────

app.get("/me", async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    res.json(session);
});

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

    console.log('  ✅ Better-Auth mounted at /api/auth/*');

    app.listen(PORT, () => {
        console.log('═══════════════════════════════════════════════════════');
        console.log(`  Server running on port ${PORT}`);
        console.log(`  API base: http://localhost:${PORT}/api/v1`);
        console.log(`  Auth:     http://localhost:${PORT}/api/auth`);
        console.log('═══════════════════════════════════════════════════════');
    });
};

start();

export default app;
