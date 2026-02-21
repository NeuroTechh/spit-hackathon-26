import crypto from 'crypto';
import { ethers } from 'ethers';

export const hashAttestation = (
    userId: string,
    docType: string,
    docHash: string,
    timestamp: number
): string => {
    return ethers.keccak256(
        ethers.solidityPacked(
            ['string', 'string', 'string', 'uint256'],
            [userId, docType, docHash, timestamp]
        )
    );
};

export const sha256 = (data: Buffer | string): string => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

export const randomHex = (bytes: number = 32): string => {
    return crypto.randomBytes(bytes).toString('hex');
};
