import { ethers, Contract } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

export const getProvider = (): ethers.JsonRpcProvider => {
    return new ethers.JsonRpcProvider(RPC_URL);
};

export const getSigner = (): ethers.Wallet => {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error('DEPLOYER_PRIVATE_KEY not configured');
    return new ethers.Wallet(privateKey, getProvider());
};

const ATTESTATION_REGISTRY_ABI = [
    'function registerAttestation(bytes32 attestationHash, address subject, uint8 docType, uint8 confidenceScore, uint8 trustScore, uint256 validDays) external',
    'function verifyAttestation(bytes32 attestationHash) external view returns (bool)',
    'function revokeAttestation(bytes32 attestationHash) external',
    'function getAttestation(bytes32 attestationHash) external view returns (tuple(bytes32 attestationHash, address attestor, address subject, uint8 docType, uint8 confidenceScore, uint8 trustScore, uint256 issuedAt, uint256 expiresAt, bool isRevoked, bool exists))',
    'function getUserAttestations(address user) external view returns (bytes32[])',
    'function isExpired(bytes32 attestationHash) external view returns (bool)',
    'function isRevoked(bytes32 attestationHash) external view returns (bool)',
    'function approvedAttestors(address) external view returns (bool)',
];

export const getAttestationRegistry = (useSigner = false): Contract => {
    const address = process.env.ATTESTATION_REGISTRY_ADDRESS;
    if (!address) throw new Error('ATTESTATION_REGISTRY_ADDRESS not configured');
    const providerOrSigner = useSigner ? getSigner() : getProvider();
    return new Contract(address, ATTESTATION_REGISTRY_ABI, providerOrSigner);
};

export const isContractConfigured = (): boolean => {
    return !!process.env.ATTESTATION_REGISTRY_ADDRESS;
};
