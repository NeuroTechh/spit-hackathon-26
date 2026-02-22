<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity" alt="Solidity" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TwypeScript" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Ethers.js-6-6C3EC1" alt="Ethers.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Hardhat-2.22-FFF100?logo=hardhat" alt="Hardhat" />
</p>

# Hudson × Piston Cup — Decentralized Identity & Event Access Platform

> A privacy-preserving, blockchain-anchored identity verification and event access management system. Hudson provides decentralized identity infrastructure; Piston Cup consumes it to gate event entry with verifiable credentials, soulbound NFT passes, and on-chain reputation.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [System Components](#system-components)
- [Blockchain Layer](#blockchain-layer--smart-contracts)
- [Backend Services](#backend-services)
- [Frontend Applications](#frontend-applications)
- [Data Flows](#data-flows)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                           │
│   Hudson Frontend (Identity & Admin)   │   Piston Cup UI (Events)    │
│          Next.js · Port 3000           │    Next.js · Port 3000      │
└────────────────────────┬───────────────┴─────────────────────────────┘
                         │ HTTPS / REST
                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      BACKEND MICROSERVICES                           │
│                                                                      │
│  ┌─────────────────────────────┐   ┌──────────────────────────────┐  │
│  │  RacePass Backend :3001     │   │  Attestation Service :3002   │  │
│  │  ─────────────────────────  │   │  ────────────────────────    │  │
│  │  Auth · DID · Credentials   │──▶│  LLM Document Verification  │  │
│  │  Reputation · Events · NFTs │   │  Trust Scoring · Anchoring   │  │
│  └──────────┬──────────────────┘   └──────────────┬───────────────┘  │
└─────────────┼─────────────────────────────────────┼──────────────────┘
              │                                     │
    ┌─────────┼─────────────────┐                   │
    ▼         ▼                 ▼                   ▼
PostgreSQL   Redis        EVM Blockchain      Google Gemini
 (Data)    (Sessions,     (Hardhat /        (Document AI
           Nonces,        Sepolia)           Verification)
           Cache)
                               │
                    ┌──────────┴──────────┐
                    │   Smart Contracts   │
                    ├─────────────────────┤
                    │ CredentialRegistry  │
                    │ EventPassNFT        │
                    │ ReputationRegistry  │
                    │ AttestationRegistry │
                    └─────────────────────┘
```

The platform operates on a **zero-knowledge, hash-only** principle: no raw personally identifiable information is ever stored on-chain or in the database. Every credential, attestation, and reputation score is represented exclusively by its cryptographic hash, enabling full verifiability without compromising user privacy.

---

## System Components

| Service | Port | Purpose |
|---------|------|---------|
| **Hudson Frontend** | 3000 | Identity management dashboard, admin panel, credential viewer |
| **Piston Cup UI** | 3000 | Event marketplace, race browsing, pass acquisition |
| **RacePass Backend** | 3001 | Core API — auth, DID, credentials, reputation, events |
| **Attestation Service** | 3002 | Isolated document verification microservice with LLM integration |
| **PostgreSQL** | 5432 | Persistent storage (hashes, metadata, relationships) |
| **Redis** | 6379 | Session management, nonce tracking, rate limit counters |

---

## Blockchain Layer — Smart Contracts

The on-chain layer is the cryptographic backbone of the platform. Four Solidity contracts deployed on EVM-compatible networks (Hardhat local / Sepolia testnet) collectively provide tamper-proof anchoring for credentials, event passes, reputation, and attestations. All contracts are written in **Solidity 0.8.24** and compiled via **Hardhat 2.22** with **OpenZeppelin 5.4** as the base library.

### CredentialRegistry.sol

The `CredentialRegistry` contract serves as the on-chain root of trust for all identity credentials issued within the platform. It operates on a **hash-only storage model** — no raw credential data ever touches the blockchain.

**Core Mechanics:**
- **Credential Registration** — When a credential is issued (age verification, KYC pass, blacklist check), the backend computes a `keccak256` hash of `(walletAddress, credentialType, issuerDID, timestamp)` and registers it on-chain via `registerCredential()`. The contract stores the hash, the issuer address, a type identifier, and a timestamp — nothing more.
- **Issuer Management** — Only approved issuers (managed by the contract owner) can register credentials. This creates a controlled trust hierarchy: the platform owner approves issuers, issuers register credential hashes, and any third party can verify a hash without needing to trust the verifier.
- **Verification** — `verifyCredential(hash)` returns the registration status, issuer, and timestamp for any credential hash. This is a pure read operation (no gas cost) that any dApp, service, or contract can call.
- **Revocation** — Issuers can revoke credentials they issued. Revocation is irreversible and immediately queryable.

**Why hash-only?** Storing hashes instead of data means the blockchain serves as an **immutable witness** without becoming a privacy liability. A credential hash proves that a specific credential existed at a specific time from a specific issuer — but reveals nothing about its content.

### EventPassNFT.sol

The `EventPassNFT` contract extends the ERC-721 standard to implement **soulbound, non-transferable event passes** that serve as the gateway to event access. It inherits from `CredentialRegistry`, creating a tight coupling between identity verification and event eligibility.

**Core Mechanics:**
- **Event Creation** — Organizers create events on-chain specifying eligibility requirements: minimum age, KYC requirement, minimum reputation score, and required credential types. Each event receives a unique `eventId`.
- **Pass Minting** — `mintPass(eventId, credentialHash)` verifies the user's credential against the `CredentialRegistry`, checks all eligibility requirements, and mints a soulbound NFT. The token is permanently bound to the recipient wallet — `transferFrom` and `safeTransferFrom` are overridden to revert.
- **Check-In** — Event organizers call `checkIn(tokenId)` to record physical attendance, creating an immutable on-chain record that feeds into the reputation system.
- **Fraud Detection** — If fraud is detected post-minting, the organizer can burn the pass via `burnOnFraud(tokenId)`, which revokes the underlying credential in the `CredentialRegistry` simultaneously.
- **Soulbound Enforcement** — Transfer functions are overridden at the contract level to prevent any token movement. This ensures passes cannot be resold, traded, or transferred — they are cryptographically bound to the identity that earned them.

**Design Rationale:** Soulbound NFTs solve the ticket scalping and identity fraud problems simultaneously. A pass is proof that *this specific wallet* met *these specific criteria* at *this specific time* — and that proof cannot be separated from the wallet that holds it.

### ReputationRegistry.sol

The `ReputationRegistry` contract anchors user reputation scores on-chain using a **hash-commitment scheme**. Rather than storing raw scores (which would leak behavioral data), it stores hashes of scores alongside metadata that enables verification without disclosure.

**Core Mechanics:**
- **Score Updates** — Authorized updaters submit `updateScore(wallet, scoreHash, metadataHash)` where `scoreHash = keccak256(wallet, totalScore, timestamp, salt)`. The salt is retained off-chain, making the hash meaningless without the backend's cooperation.
- **Hash Verification** — `verifyScoreHash(wallet, scoreHash)` confirms whether a given hash matches the latest on-chain record. This enables selective disclosure: a user can prove their score exceeds a threshold by revealing the preimage to a verifier, who then confirms it against the chain.
- **Updater Management** — Only approved updaters (the backend service) can modify score hashes. This prevents score manipulation while maintaining a public audit trail.
- **Existence Checks** — `hasReputation(wallet)` provides a binary signal indicating whether a wallet has any reputation history, useful for gating access without revealing scores.

**Scoring Model (Off-Chain):**

| Action | Points | Trigger |
|--------|--------|---------|
| Event Attendance | +10 | Check-in confirmed on-chain |
| Successful Check-In | +5 | Credential verified at gate |
| No-Show | -15 | Pass minted but no check-in |
| Fraud Attempt | -50 | Fraudulent credential detected |

### AttestationRegistry.sol

The `AttestationRegistry` contract manages on-chain anchoring for document attestations produced by the Attestation Service. It stores attestation hashes alongside document type identifiers, confidence scores, and trust scores — all computed off-chain by the LLM verification pipeline.

**Core Mechanics:**
- **Attestation Registration** — `registerAttestation(attestationHash, docType, confidenceScore, trustScore)` anchors a verified attestation. The `attestationHash = keccak256(walletAddress, docHash, docType, timestamp)` binds the attestation to a specific document verification event.
- **Document Types** — Supports passport (1), national ID (2), driver's license (3), and Aadhaar (4), each with a numeric type identifier for efficient on-chain storage.
- **Confidence & Trust Scores** — The LLM's confidence score and the computed trust score are stored as uint8 values (0–100), enabling on-chain queries like "does this user have a high-confidence passport attestation?"
- **Expiration** — Attestations carry an expiration timestamp, after which they are no longer considered valid by on-chain queries.
- **Attestor Management** — Only approved attestor addresses (the Attestation Service) can register attestations, preventing unauthorized anchoring.

### Contract Interaction Model

```
User Wallet
    │
    ├──▶ CredentialRegistry.verifyCredential(hash)     ← Public read (free)
    ├──▶ EventPassNFT.mintPass(eventId, credHash)      ← Requires valid credential
    ├──▶ ReputationRegistry.verifyScoreHash(wallet, h) ← Public read (free)
    └──▶ AttestationRegistry.getAttestation(hash)      ← Public read (free)

Backend Service (Signer)
    │
    ├──▶ CredentialRegistry.registerCredential(hash, type)
    ├──▶ EventPassNFT.createEvent(requirements)
    ├──▶ ReputationRegistry.updateScore(wallet, scoreHash)
    └──▶ AttestationRegistry.registerAttestation(hash, type, scores)
```

All write operations are executed by the backend service wallet (the contract deployer or approved operator). Read operations are public and free, enabling any third party to independently verify credentials, passes, reputation, and attestations without trusting the platform.

---

## Backend Services

### RacePass Backend (Port 3001)

The primary API server handling authentication, identity, credentials, reputation, and event management.

**Authentication** — Wallet-based challenge-response authentication using EIP-191 signed messages. The backend issues a nonce, the user signs it with their wallet, and the backend verifies the signature to establish a session. Sessions are tracked in Redis with JWT tokens.

**Decentralized Identifiers (DIDs)** — Each authenticated wallet is assigned a DID in the format `did:racepass:<wallet_address>`. The backend generates W3C-compatible DID Documents containing the wallet's public key and authentication methods.

**Verifiable Credentials** — Credentials are generated in W3C Verifiable Credential JSON-LD format, containing claims (age verification, KYC status, blacklist clearance) signed by the platform's issuer DID. The credential hash is registered on the `CredentialRegistry` contract.

**Zero-Knowledge Proof Generation** — The proof system generates hash-based ZK proofs for selective disclosure:
- **Age Proofs** — Prove age exceeds a threshold without revealing the actual age
- **KYC Proofs** — Prove KYC completion without revealing documents
- **Blacklist Proofs** — Prove absence from blacklists without revealing identity

Each proof contains a commitment, nullifier (preventing double-use), public inputs, and an expiration timestamp. The architecture is designed for upgrade to Groth16/PLONK circuits.

**Middleware Stack:**
- Rate limiting (20 req/15min for auth, 10 req/hr for verification)
- Zod schema validation on all inputs
- Audit logging for all sensitive operations (no PII in logs)
- Helmet for HTTP security headers
- CORS configuration

### Attestation Service (Port 3002)

An isolated microservice responsible for document verification using LLM-based analysis.

**Verification Pipeline:**
1. User uploads a document (passport, national ID, driver's license, Aadhaar)
2. Document is hashed with SHA-256 — the raw file is never persisted
3. The document image is sent to **Google Gemini 1.5 Flash** with a structured verification prompt
4. Gemini returns a confidence score (0–100), detected fields, red flags, and a validity assessment
5. A trust score is computed based on confidence, document type tier, and historical attestation count
6. An attestation hash is generated and anchored on the `AttestationRegistry` contract
7. The attestation record (hash, scores, outcome) is stored in PostgreSQL
8. The aggregate trust score for the user is recomputed

**Trust Score Computation** — Individual trust scores factor in the LLM's confidence, the document type tier (passport > national ID > driver's license), and the verification outcome. Aggregate scores combine all of a user's attestations into a single 0–100 score.

---

## Frontend Applications

### Hudson Frontend

The identity management interface built with Next.js 16, React 19, Radix UI, and Tailwind CSS 4. Provides:

- **Dashboard** — Overview of identity status, credentials, and reputation
- **Verification Flow** — Document upload and identity verification
- **Credential Viewer** — Browse issued credentials with on-chain status
- **Reputation Display** — Score breakdown with history
- **Event Management** — Browse events, check eligibility, mint passes
- **Public Verification** — Shareable credential verification pages

### Piston Cup UI

The event marketplace and administration frontend — a consumer-facing interface for discovering and accessing events, plus a full admin panel for platform management. Built with Next.js 16, Framer Motion for animations, and Tailwind CSS 4. Provides:

- **Event Discovery** — Browse featured races, upcoming events, and categories
- **Event Details** — Eligibility requirements, credential checks, pass minting
- **Onboarding Flow** — Get Verified → Earn Pass → Build Reputation → Access More
- **Authentication** — Wallet connection for identity-gated access
- **Admin Panel** — Platform statistics dashboard, user management with role assignment, event creation and oversight, user report review with reputation score adjustments

Piston Cup consumes Hudson's identity infrastructure: it reads credentials and reputation from the backend to determine event eligibility, then mints soulbound NFT passes for qualified users. The admin panel is co-located within Piston Cup since it manages event-facing operations — user oversight, event CRUD, and report processing — all of which are directly tied to the event lifecycle.

---

## Data Flows

### Identity Verification

```
User ──▶ Upload Document ──▶ RacePass Backend ──▶ Attestation Service
                                                        │
                                              ┌─────────┴─────────┐
                                              ▼                   ▼
                                         Hash Document      Send to Gemini
                                         (SHA-256)          (LLM Verify)
                                              │                   │
                                              └─────────┬─────────┘
                                                        ▼
                                              Compute Trust Score
                                                        │
                                              Anchor on AttestationRegistry
                                                        │
                                              ◀─────────┘
                                    Create Credential Hash (keccak256)
                                              │
                                    Register on CredentialRegistry
                                              │
                                    Generate W3C Verifiable Credential
                                              │
                                              ▼
                                    Return to User (VC + tx hash)
```

### Event Pass Minting

```
User ──▶ Check Eligibility ──▶ Backend verifies:
                                  ├─ Credential exists on-chain?
                                  ├─ Credential not revoked?
                                  ├─ Age requirement met?
                                  ├─ KYC requirement met?
                                  └─ Reputation threshold met?
                                          │
                                    All checks pass
                                          │
                                    EventPassNFT.mintPass()
                                          │
                                    Soulbound NFT minted
                                          │
                                    Return token ID + tx hash
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Contracts** | Solidity 0.8.24, OpenZeppelin 5.4, Hardhat 2.22 |
| **Blockchain Interaction** | Ethers.js 6, Hardhat Network / Sepolia Testnet |
| **Backend Runtime** | Node.js, TypeScript 5.8, Express 4.21 |
| **Authentication** | Better-Auth 1.4, EIP-191 Wallet Signatures, JWT |
| **Database** | PostgreSQL 16, Prisma 7 (auth tables), Raw pg driver (core) |
| **Caching** | Redis 7 (sessions, nonces, rate limits) |
| **AI/ML** | Google Gemini 1.5 Flash (document verification) |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Radix UI, Framer Motion |
| **Validation** | Zod 4 |
| **Containerization** | Docker, Docker Compose |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16
- Redis 7
- pnpm (recommended) or npm

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd neurotechh--

# Start all services (installs dependencies automatically)
chmod +x start.sh
./start.sh
```

The `start.sh` script orchestrates startup of all three services with dependency checking, color-coded logging, and graceful shutdown handling.

### Manual Setup

```bash
# 1. Start infrastructure
docker compose -f hudson-backend/docker-compose.yml up -d

# 2. Start RacePass Backend
cd hudson-backend
pnpm install
cp .env.example .env  # Configure environment variables
pnpm dev              # Starts on port 3001

# 3. Start Attestation Service
cd attestation-service
pnpm install
cp .env.example .env
pnpm dev              # Starts on port 3002

# 4. Start Frontend (Hudson or Piston Cup)
cd hudson-frontend    # or piston-cup-ui
pnpm install
pnpm dev              # Starts on port 3000
```

### Deploy Smart Contracts

```bash
cd hudson-backend
npx hardhat compile
npx hardhat run scripts/deploy.ts --network localhost  # or --network sepolia
```

---

## Environment Variables

### RacePass Backend

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for JWT token signing |
| `BLOCKCHAIN_RPC_URL` | EVM JSON-RPC endpoint |
| `PRIVATE_KEY` | Deployer/signer wallet private key |
| `CREDENTIAL_REGISTRY_ADDRESS` | Deployed CredentialRegistry address |
| `EVENT_PASS_NFT_ADDRESS` | Deployed EventPassNFT address |
| `REPUTATION_REGISTRY_ADDRESS` | Deployed ReputationRegistry address |
| `ATTESTATION_SERVICE_URL` | URL of the Attestation Service |

### Attestation Service

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_AI_API_KEY` | Google Gemini API key |
| `BLOCKCHAIN_RPC_URL` | EVM JSON-RPC endpoint |
| `PRIVATE_KEY` | Attestor wallet private key |
| `ATTESTATION_REGISTRY_ADDRESS` | Deployed AttestationRegistry address |

---

## API Reference

### RacePass Backend — `http://localhost:3001/api/v1`

<details>
<summary><strong>Authentication</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/user/auth/nonce` | Request challenge nonce for wallet |
| `POST` | `/user/auth/verify` | Verify signed nonce, establish session |
| `GET` | `/user/profile` | Get authenticated user profile + DID |
| `PUT` | `/user/profile` | Update display name |

</details>

<details>
<summary><strong>Identity</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/identity/verify/init` | Initialize identity verification |
| `POST` | `/identity/verify/submit/:requestId` | Submit document for verification |
| `GET` | `/identity/verifications` | List user's verification history |

</details>

<details>
<summary><strong>Credentials</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/credentials` | List user's credentials |
| `GET` | `/credentials/:id` | Get credential details |
| `POST` | `/credentials/:id/revoke` | Revoke a credential |
| `POST` | `/credentials/proof/generate` | Generate ZK proof for selective disclosure |

</details>

<details>
<summary><strong>Reputation</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reputation/score` | Get user's reputation score |
| `GET` | `/reputation/history` | Get reputation action history |
| `POST` | `/reputation/action` | Record reputation action (organizer) |
| `POST` | `/reputation/publish` | Publish score hash on-chain |
| `POST` | `/reputation/disclose` | Selective reputation disclosure |

</details>

<details>
<summary><strong>Events</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/events` | List all events |
| `GET` | `/events/:id` | Get event details |
| `POST` | `/events` | Create event (organizer) |
| `GET` | `/events/:id/eligibility` | Check user eligibility |
| `POST` | `/events/:id/mint` | Mint soulbound event pass |
| `POST` | `/events/:id/passes/:passId/checkin` | Check in at event |

</details>

<details>
<summary><strong>Public Verification</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/verify/credential/:hash` | Verify credential on-chain |
| `GET` | `/verify/nft/:wallet/:eventId` | Verify NFT ownership |
| `GET` | `/verify/reputation/:wallet` | Check reputation score |
| `POST` | `/verify/full` | Full verification bundle |

</details>

### Attestation Service — `http://localhost:3002/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/attest` | Submit document for LLM verification |
| `GET` | `/attestation/:id` | Get attestation record |
| `GET` | `/attestations/user/:userId` | Get user's attestations |
| `GET` | `/trust-score/:userId` | Get aggregate trust score |
| `GET` | `/verify/:attestationHash` | Verify attestation on-chain |
| `POST` | `/revoke/:attestationHash` | Revoke attestation |

---

## Security Model

- **Zero PII Storage** — Only cryptographic hashes of credentials and documents are stored. Raw data never persists.
- **Hash-Based Verification** — On-chain contracts store and verify hashes exclusively. Verifiability without data exposure.
- **Wallet Signature Auth** — EIP-191 challenge-response authentication. No passwords. No email/password database.
- **Soulbound Tokens** — Event pass NFTs are non-transferable at the contract level. Transfer functions revert unconditionally.
- **Nonce Replay Protection** — Single-use nonces tracked in Redis prevent signature replay attacks.
- **Selective Disclosure** — ZK proofs allow users to prove claims (age > 18, KYC passed) without revealing underlying data.
- **Audit Trail** — All sensitive operations logged with no PII in log entries.
- **Rate Limiting** — Per-endpoint rate limits enforced via Redis counters.

---

## License

This project was built for Neurotechh++.
