import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Better Auth handler — must be mounted BEFORE express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

// JSON body parser — after auth handler
app.use(express.json());

// Well-known OAuth/OIDC discovery endpoints
app.get("/.well-known/openid-configuration", async (req, res) => {
  const baseUrl = process.env.BETTER_AUTH_URL || `http://localhost:${PORT}`;
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
  const baseUrl = process.env.BETTER_AUTH_URL || `http://localhost:${PORT}`;
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

// Protected route example
app.get("/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(session);
});

app.listen(PORT, () => {
  console.log(`Hudson backend running on http://localhost:${PORT}`);
});
