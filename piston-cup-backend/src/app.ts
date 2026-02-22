import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { createProxyMiddleware } from "http-proxy-middleware";
import { auth, getHudsonAccessToken } from "./auth";

const app = express();

// ─── Security ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: ["http://localhost:3005"],
    credentials: true,
}));

// ─── Debug: log all auth requests ────────────────────────────
app.use("/api/auth", (req, _res, next) => {
    console.log(`[AUTH] ${req.method} ${req.originalUrl}`);
    console.log(`[AUTH] cookies: ${req.headers.cookie || "(none)"}`);
    console.log(`[AUTH] origin: ${req.headers.origin || "(none)"}`);
    console.log(`[AUTH] referer: ${req.headers.referer || "(none)"}`);
    next();
});

// ─── Better Auth Handler (must be BEFORE express.json()) ────
app.all("/api/auth/*", toNodeHandler(auth));

// ─── Body Parser ────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));

// ─── Session Info ───────────────────────────────────────────
app.get("/me", async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    res.json(session);
});

// ─── Proxy /api/v1/* to Hudson Backend ──────────────────────
// Attaches the Hudson OAuth access token as a Bearer header
// so Hudson's authenticate middleware can verify the request.

const HUDSON_BACKEND = process.env.HUDSON_BACKEND_URL || "http://localhost:3001";

app.use(
    "/api/v1",
    async (req, _res, next) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });
            if (session) {
                const accessToken = await getHudsonAccessToken(session.user.id);
                if (accessToken) {
                    req.headers["authorization"] = `Bearer ${accessToken}`;
                }
            }
        } catch {
            // Pass through — Hudson will reject if unauthorized
        }
        next();
    },
    createProxyMiddleware({
        target: HUDSON_BACKEND,
        changeOrigin: true,
        pathRewrite: (_path, req) => req.originalUrl,
    })
);

// ─── Health Check ───────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "piston-cup-backend",
        hudsonBackend: HUDSON_BACKEND,
        uptime: process.uptime(),
    });
});

// ─── 404 ────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});

// ─── Start ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3003");

app.listen(PORT, () => {
    console.log("═══════════════════════════════════════════════");
    console.log("  Piston Cup — Backend");
    console.log("═══════════════════════════════════════════════");
    console.log(`  Port:    ${PORT}`);
    console.log(`  Auth:    http://localhost:${PORT}/api/auth`);
    console.log(`  Proxy:   /api/v1/* -> ${HUDSON_BACKEND}`);
    console.log(`  Hudson:  ${process.env.HUDSON_ISSUER_URL || "http://localhost:3001"}`);
    console.log("═══════════════════════════════════════════════");
});

export default app;
