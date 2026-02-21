# RacePass — Production Backend

> Blockchain-powered, privacy-preserving universal identity & reputation platform.

## Architecture

```
Client → Express API → PostgreSQL (data) + Redis (sessions/cache) → Blockchain (on-chain proofs)
                ↓
        Reclaim Protocol (identity verification)
                ↓
        Smart Contracts (credential registry, soulbound NFTs, reputation hashes)
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start infrastructure (PostgreSQL + Redis)
docker-compose -f docker/docker-compose.yml up -d

# 4. Run database migrations
psql $DATABASE_URL < database/migrations/001_initial_schema.sql

# 5. Compile & deploy smart contracts (local Hardhat node)
npx hardhat node &
npx hardhat run scripts/deploy.ts --network localhost

# 6. Start development server
npm run dev
```

### Docker (Full Stack)

```bash
docker-compose -f docker/docker-compose.yml --profile full up --build
```

---

## API Endpoints

Base URL: `http://localhost:3001/api/v1`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/user/auth/nonce` | ❌ | Get nonce for wallet signature |
| POST | `/user/auth/verify` | ❌ | Verify signature, get JWT |
| GET | `/user/profile` | ✅ | Get own profile + DID document |
| PUT | `/user/profile` | ✅ | Update display name |

### Identity Verification

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/identity/verify/init` | ✅ | Start Reclaim Protocol verification |
| POST | `/identity/verify/callback/:id` | ✅ | Submit verification proof |
| GET | `/identity/verifications` | ✅ | List user's verifications |

### Credentials

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/credentials` | ✅ | List user's credentials |
| GET | `/credentials/:id` | ✅ | Get single credential |
| POST | `/credentials/:id/revoke` | ✅ | Revoke a credential |
| POST | `/credentials/proof/generate` | ✅ | Generate selective disclosure proof |
| GET | `/credentials/verify/:hash` | ❌ | Verify credential on-chain |

### Reputation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reputation/score` | ✅ | Get reputation score |
| GET | `/reputation/history` | ✅ | Get reputation history |
| POST | `/reputation/action` | ✅ 🔒 | Record action (organizer/verifier only) |
| POST | `/reputation/publish` | ✅ | Publish score hash on-chain |
| POST | `/reputation/disclose` | ✅ | Selective reputation disclosure |

### Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | ❌ | List all events |
| GET | `/events/:id` | ❌ | Get event details |
| POST | `/events` | ✅ 🔒 | Create event (organizer only) |
| GET | `/events/:id/eligibility` | ✅ | Check pass eligibility |
| POST | `/events/:id/mint` | ✅ | Mint soulbound event pass |
| POST | `/events/:id/passes/:passId/checkin` | ✅ 🔒 | Check in (organizer only) |

### Cross-Platform Verification (Public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/verify/credential/:hash` | ❌ | Verify credential on-chain |
| GET | `/verify/nft/:wallet/:eventId` | ❌ | Verify NFT ownership |
| GET | `/verify/reputation/:wallet` | ❌ | Verify reputation eligibility |
| POST | `/verify/full` | ❌ | Full verification bundle |

---

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| `CredentialRegistry` | Hash-based credential registration, verification, revocation |
| `EventPassNFT` | Soulbound ERC721 tokens with credential-gated minting |
| `ReputationRegistry` | On-chain reputation score hash storage |

---

## Security

- **Zero PII Storage** — Only hashes, commitments, and metadata stored
- **JWT + Redis Sessions** — Token-based auth with server-side invalidation
- **Rate Limiting** — Per-endpoint (auth: 20/15min, verify: 10/hr)
- **Nonce-based Replay Protection** — Redis-tracked nonces
- **Audit Logging** — All sensitive operations logged (no PII)
- **Soulbound NFTs** — Non-transferable event passes
- **Selective Disclosure** — Share only what's needed

## Tech Stack

TypeScript, Express, PostgreSQL, Redis, Ethers.js v6, Hardhat, OpenZeppelin, Zod, JWT, Reclaim Protocol SDK

---

## Project Structure

```
racepass-backend/
├── contracts/              # Solidity smart contracts
├── database/migrations/    # PostgreSQL schema
├── docker/                 # Docker Compose + Dockerfile
├── scripts/                # Deployment scripts
└── src/
    ├── app.ts              # Express entry point
    ├── blockchain/         # Contract wrappers
    ├── config/             # DB + Redis configuration
    ├── middleware/          # Auth, rate-limit, audit, validation
    ├── modules/
    │   ├── user/           # Wallet auth, profiles, DID
    │   ├── identity/       # Reclaim Protocol verification
    │   ├── credential/     # Credential management + ZK proofs
    │   ├── reputation/     # Score tracking + on-chain publishing
    │   ├── event/          # Event management + soulbound NFT minting
    │   └── verification/   # Cross-platform stateless verification
    └── utils/              # DID, crypto, ZK proof utilities
```
