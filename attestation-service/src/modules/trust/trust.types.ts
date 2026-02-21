export interface TrustScore {
    userId: string;
    walletAddress: string;
    aggregateScore: number;
    attestationCount: number;
    highestDocTier: string | null;
    lastComputedAt: Date;
}

export const DOC_TIER_SCORES: Record<string, number> = {
    passport: 50,
    national_id: 40,
    drivers_license: 35,
    aadhaar: 30,
};

export const DOC_TIER_ORDER: Record<string, number> = {
    passport: 4,
    national_id: 3,
    drivers_license: 2,
    aadhaar: 1,
};
