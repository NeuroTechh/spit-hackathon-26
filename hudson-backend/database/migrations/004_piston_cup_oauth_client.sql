-- Register Piston Cup as an OAuth client on Hudson
-- Run this against Hudson's PostgreSQL database.
--
-- This allows Piston Cup backend to authenticate users via Hudson's OAuth2
-- authorization code flow with PKCE.

INSERT INTO "oauthClient" (
    id,
    "clientId",
    "clientSecret",
    name,
    disabled,
    "skipConsent",
    scopes,
    "redirectUris",
    "postLogoutRedirectUris",
    "tokenEndpointAuthMethod",
    "grantTypes",
    "responseTypes",
    type,
    public,
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    'piston-cup',
    'piston-cup-secret-change-me',
    'Piston Cup',
    false,
    true,
    ARRAY['openid', 'profile', 'email'],
    ARRAY['http://localhost:3004/api/auth/oauth2/callback/hudson'],
    ARRAY['http://localhost:3005'],
    'client_secret_post',
    ARRAY['authorization_code', 'refresh_token'],
    ARRAY['code'],
    'web',
    false,
    NOW(),
    NOW()
)
ON CONFLICT ("clientId") DO NOTHING;
