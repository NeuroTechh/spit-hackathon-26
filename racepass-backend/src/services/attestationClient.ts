import dotenv from 'dotenv';

dotenv.config();

const ATTESTATION_SERVICE_URL = process.env.ATTESTATION_SERVICE_URL || 'http://localhost:3002';
const API_KEY = process.env.ATTESTATION_SERVICE_API_KEY || 'dev-api-key-change-in-production';

const headers = (): Record<string, string> => ({
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
});

// ─── Request Attestation (with document) ─────────────────────

export const requestAttestation = async (
    userId: string,
    walletAddress: string,
    docType: string,
    documentBuffer: Buffer,
    mimeType: string,
    fileName: string
): Promise<any> => {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('walletAddress', walletAddress);
    formData.append('docType', docType);
    formData.append('document', new Blob([documentBuffer], { type: mimeType }), fileName);

    const response = await fetch(`${ATTESTATION_SERVICE_URL}/api/v1/attest`, {
        method: 'POST',
        headers: { 'X-API-Key': API_KEY },
        body: formData,
    });

    if (!response.ok) {
        const errBody: any = await response.json().catch(() => ({ error: 'Unknown error' }));
        const details = errBody.details ? `: ${JSON.stringify(errBody.details)}` : '';
        throw new Error((errBody.error || `Attestation service returned ${response.status}`) + details);
    }

    return response.json();
};

// ─── Get Attestation ─────────────────────────────────────────

export const getAttestation = async (attestationId: string): Promise<any> => {
    const response = await fetch(
        `${ATTESTATION_SERVICE_URL}/api/v1/attestation/${attestationId}`,
        { headers: headers() }
    );

    if (!response.ok) return null;
    return response.json();
};

// ─── Get User's Attestations ─────────────────────────────────

export const getUserAttestations = async (userId: string): Promise<any[]> => {
    const response = await fetch(
        `${ATTESTATION_SERVICE_URL}/api/v1/attestations/user/${userId}`,
        { headers: headers() }
    );

    if (!response.ok) return [];
    const data: any = await response.json();
    return data.attestations || [];
};

// ─── Get Trust Score ─────────────────────────────────────────

export const getUserTrustScore = async (userId: string): Promise<any> => {
    const response = await fetch(
        `${ATTESTATION_SERVICE_URL}/api/v1/trust-score/${userId}`,
        { headers: headers() }
    );

    if (!response.ok) return { aggregateScore: 0, attestationCount: 0 };
    return response.json();
};
