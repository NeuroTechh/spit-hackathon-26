import crypto from 'crypto';

/// Generates a DID (Decentralized Identifier) for a wallet address.
/// Format: did:racepass:<checksummed_wallet_address>
export const generateDID = (walletAddress: string): string => {
    const normalized = walletAddress.toLowerCase();
    return `did:racepass:${normalized}`;
};

/// Resolves a DID back to a wallet address.
export const resolveDID = (did: string): string | null => {
    const prefix = 'did:racepass:';
    if (!did.startsWith(prefix)) return null;
    return did.substring(prefix.length);
};

/// Validates DID format.
export const isValidDID = (did: string): boolean => {
    return /^did:racepass:0x[a-f0-9]{40}$/.test(did);
};

/// Creates a DID document (W3C-compatible subset).
export const createDIDDocument = (
    walletAddress: string,
    did: string
): Record<string, any> => {
    return {
        '@context': 'https://www.w3.org/ns/did/v1',
        id: did,
        controller: did,
        verificationMethod: [
            {
                id: `${did}#wallet`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `eip155:1:${walletAddress}`,
            },
        ],
        authentication: [`${did}#wallet`],
        assertionMethod: [`${did}#wallet`],
        created: new Date().toISOString(),
    };
};
