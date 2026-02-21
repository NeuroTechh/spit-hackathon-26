import { getCredentialRegistry, getEventPassNFT, getReputationRegistry } from '../../blockchain/contracts';
import { query } from '../../config/database';
import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════
// Cross-Platform Verification Service
// ═══════════════════════════════════════════════════════════
// Stateless verification — reads directly from chain.
// No PII exposure. Anyone can verify without this backend.
// ═══════════════════════════════════════════════════════════

// ─── Verify Credential Proof ─────────────────────────────────

export const verifyCredentialProof = async (credentialHash: string) => {
    const registry = getCredentialRegistry();

    const isValid = await registry.verifyCredential(credentialHash);
    const record = await registry.getCredential(credentialHash);

    return {
        valid: isValid,
        credentialHash,
        onChain: {
            issuer: record.issuer,
            issuedAt: Number(record.issuedAt),
            expiresAt: Number(record.expiresAt),
            isRevoked: record.isRevoked,
            exists: record.exists,
        },
        verifiedAt: Date.now(),
        stateless: true,
        noPII: true,
    };
};

// ─── Verify NFT Ownership ────────────────────────────────────

export const verifyNFTOwnership = async (walletAddress: string, eventId: number) => {
    if (!ethers.isAddress(walletAddress)) throw new Error('Invalid wallet address');

    const nftContract = getEventPassNFT();

    const hasPass = await nftContract.hasPass(walletAddress, eventId);
    let tokenId: number | null = null;
    let passDetails: any = null;

    if (hasPass) {
        tokenId = Number(await nftContract.getUserPassForEvent(walletAddress, eventId));
        passDetails = await nftContract.getPass(tokenId);
    }

    return {
        hasPass,
        walletAddress,
        eventId,
        tokenId,
        pass: hasPass ? {
            isCheckedIn: passDetails.isCheckedIn,
            checkedInAt: Number(passDetails.checkedInAt),
            isBurned: passDetails.isBurned,
        } : null,
        verifiedAt: Date.now(),
        stateless: true,
        noPII: true,
    };
};

// ─── Verify Reputation Eligibility ───────────────────────────

export const verifyReputationEligibility = async (
    walletAddress: string,
    minScore: number
) => {
    if (!ethers.isAddress(walletAddress)) throw new Error('Invalid wallet address');

    const repRegistry = getReputationRegistry();
    const hasReputation = await repRegistry.hasReputation(walletAddress);
    const scoreHash = hasReputation
        ? await repRegistry.getScoreHash(walletAddress)
        : ethers.ZeroHash;

    // Cross-reference with off-chain score (optional)
    let meetsMinimum: boolean | null = null;
    try {
        const dbResult = await query(
            `SELECT rs.total_score FROM reputation_scores rs
       JOIN users u ON u.id = rs.user_id
       WHERE u.wallet_address = $1`,
            [walletAddress.toLowerCase()]
        );
        if (dbResult.rows.length > 0) {
            meetsMinimum = dbResult.rows[0].total_score >= minScore;
        }
    } catch {
        // DB unavailable — rely on on-chain data only
    }

    return {
        walletAddress,
        hasReputation,
        scoreHash,
        minScoreRequired: minScore,
        meetsMinimum,
        verifiedAt: Date.now(),
        stateless: true,
        noPII: true,
    };
};

// ─── Full Verification Bundle ────────────────────────────────

export const fullVerification = async (
    walletAddress: string,
    credentialHash?: string,
    eventId?: number,
    minReputationScore?: number
) => {
    const results: Record<string, any> = { walletAddress, verifiedAt: Date.now() };

    if (credentialHash) {
        results.credential = await verifyCredentialProof(credentialHash);
    }

    if (eventId !== undefined) {
        results.nftOwnership = await verifyNFTOwnership(walletAddress, eventId);
    }

    if (minReputationScore !== undefined) {
        results.reputation = await verifyReputationEligibility(walletAddress, minReputationScore);
    }

    results.stateless = true;
    results.noPII = true;

    return results;
};
