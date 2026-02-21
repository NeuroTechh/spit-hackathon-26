export interface AttestationRecord {
    id: string;
    userId: string;
    walletAddress: string;
    docType: string;
    docHash: string;
    attestationHash: string | null;
    status: 'pending' | 'verified' | 'rejected' | 'revoked' | 'expired';
    confidenceScore: number | null;
    verificationOutcome: Record<string, any> | null;
    trustScore: number | null;
    attestorDid: string;
    onChainTxHash: string | null;
    issuedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
}

export interface AttestationResult {
    attestationId: string;
    attestationHash: string;
    status: string;
    docType: string;
    confidenceScore: number;
    trustScore: number;
    verificationOutcome: Record<string, any>;
    onChainTxHash: string | null;
    issuedAt: string;
    expiresAt: string;
}

export interface OnChainVerification {
    valid: boolean;
    attestationHash: string;
    onChain: {
        attestor: string;
        subject: string;
        docType: number;
        confidenceScore: number;
        trustScore: number;
        issuedAt: number;
        expiresAt: number;
        isRevoked: boolean;
        exists: boolean;
    };
    verifiedAt: number;
    stateless: true;
    noPII: true;
}

export const DOC_TYPE_ENUM: Record<string, number> = {
    passport: 1,
    aadhaar: 2,
    drivers_license: 3,
    national_id: 4,
};
