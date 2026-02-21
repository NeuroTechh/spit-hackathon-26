import { ethers, Contract } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// ─── Provider & Signer ──────────────────────────────────────

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

export const getProvider = (): ethers.JsonRpcProvider => {
    return new ethers.JsonRpcProvider(RPC_URL);
};

export const getSigner = (): ethers.Wallet => {
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error('DEPLOYER_PRIVATE_KEY not configured');
    return new ethers.Wallet(privateKey, getProvider());
};

// ─── ABIs (minimal — only what we call from the backend) ─────

const CREDENTIAL_REGISTRY_ABI = [
    'function registerCredential(bytes32 credentialHash, address subject, uint256 validDays) external',
    'function verifyCredential(bytes32 credentialHash) external view returns (bool)',
    'function revokeCredential(bytes32 credentialHash) external',
    'function getCredential(bytes32 credentialHash) external view returns (tuple(bytes32 credentialHash, address issuer, uint256 issuedAt, uint256 expiresAt, bool isRevoked, bool exists))',
    'function getUserCredentials(address user) external view returns (bytes32[])',
    'function isExpired(bytes32 credentialHash) external view returns (bool)',
    'function isRevoked(bytes32 credentialHash) external view returns (bool)',
    'function approvedIssuers(address) external view returns (bool)',
];

const EVENT_PASS_NFT_ABI = [
    'function createEvent(string name, uint256 date, uint256 minAge, bool requiresKYC, uint256 minReputationScore, uint256 maxAttendees, bytes32 metadataHash) external returns (uint256)',
    'function cancelEvent(uint256 eventId) external',
    'function mintPass(address to, uint256 eventId, bytes32 credentialHash) external',
    'function checkIn(uint256 tokenId) external',
    'function burnOnFraud(uint256 tokenId, string reason) external',
    'function getEvent(uint256 eventId) external view returns (tuple(string name, uint256 date, uint256 minAge, bool requiresKYC, uint256 minReputationScore, uint256 maxAttendees, uint256 mintedCount, bytes32 metadataHash, address organizer, bool exists, bool cancelled))',
    'function getPass(uint256 tokenId) external view returns (tuple(uint256 eventId, address holder, bool isCheckedIn, uint256 checkedInAt, bool isBurned))',
    'function hasPass(address holder, uint256 eventId) external view returns (bool)',
    'function getUserPassForEvent(address user, uint256 eventId) external view returns (uint256)',
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function eventCounter() external view returns (uint256)',
];

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

const REPUTATION_REGISTRY_ABI = [
    'function updateScore(address user, bytes32 scoreHash) external',
    'function getScoreHash(address user) external view returns (bytes32)',
    'function getScoreRecord(address user) external view returns (tuple(bytes32 scoreHash, uint256 updatedAt, address updatedBy, uint256 updateCount, bool exists))',
    'function verifyScoreHash(address user, bytes32 scoreHash) external view returns (bool)',
    'function hasReputation(address user) external view returns (bool)',
];

// ─── Contract Instances ──────────────────────────────────────

export const getCredentialRegistry = (useSigner = false): Contract => {
    const address = process.env.CREDENTIAL_REGISTRY_ADDRESS;
    if (!address) throw new Error('CREDENTIAL_REGISTRY_ADDRESS not configured');
    const providerOrSigner = useSigner ? getSigner() : getProvider();
    return new Contract(address, CREDENTIAL_REGISTRY_ABI, providerOrSigner);
};

export const getEventPassNFT = (useSigner = false): Contract => {
    const address = process.env.EVENT_PASS_NFT_ADDRESS;
    if (!address) throw new Error('EVENT_PASS_NFT_ADDRESS not configured');
    const providerOrSigner = useSigner ? getSigner() : getProvider();
    return new Contract(address, EVENT_PASS_NFT_ABI, providerOrSigner);
};

export const getReputationRegistry = (useSigner = false): Contract => {
    const address = process.env.REPUTATION_REGISTRY_ADDRESS;
    if (!address) throw new Error('REPUTATION_REGISTRY_ADDRESS not configured');
    const providerOrSigner = useSigner ? getSigner() : getProvider();
    return new Contract(address, REPUTATION_REGISTRY_ABI, providerOrSigner);
};

export const getAttestationRegistry = (useSigner = false): Contract => {
    const address = process.env.ATTESTATION_REGISTRY_ADDRESS;
    if (!address) throw new Error('ATTESTATION_REGISTRY_ADDRESS not configured');
    const providerOrSigner = useSigner ? getSigner() : getProvider();
    return new Contract(address, ATTESTATION_REGISTRY_ABI, providerOrSigner);
};

// ─── Utility ─────────────────────────────────────────────────

export const isContractConfigured = (): {
    credentialRegistry: boolean;
    eventPassNFT: boolean;
    reputationRegistry: boolean;
    attestationRegistry: boolean;
} => ({
    credentialRegistry: !!process.env.CREDENTIAL_REGISTRY_ADDRESS,
    eventPassNFT: !!process.env.EVENT_PASS_NFT_ADDRESS,
    reputationRegistry: !!process.env.REPUTATION_REGISTRY_ADDRESS,
    attestationRegistry: !!process.env.ATTESTATION_REGISTRY_ADDRESS,
});
