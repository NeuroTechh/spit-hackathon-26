import { ethers } from "hardhat";

async function main() {
    console.log("═══════════════════════════════════════════════════════");
    console.log("  RacePass — Smart Contract Deployment");
    console.log("═══════════════════════════════════════════════════════");

    const [deployer] = await ethers.getSigners();
    console.log(`  Deployer: ${deployer.address}`);
    console.log(`  Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

    // ─── 1. Deploy CredentialRegistry ──────────────────────────
    console.log("\n  Deploying CredentialRegistry...");
    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    const credentialRegistry = await CredentialRegistry.deploy();
    await credentialRegistry.waitForDeployment();
    const credentialRegistryAddress = await credentialRegistry.getAddress();
    console.log(`  ✅ CredentialRegistry deployed at: ${credentialRegistryAddress}`);

    // ─── 2. Deploy ReputationRegistry ─────────────────────────
    console.log("\n  Deploying ReputationRegistry...");
    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry");
    const reputationRegistry = await ReputationRegistry.deploy();
    await reputationRegistry.waitForDeployment();
    const reputationRegistryAddress = await reputationRegistry.getAddress();
    console.log(`  ✅ ReputationRegistry deployed at: ${reputationRegistryAddress}`);

    // ─── 3. Deploy EventPassNFT ────────────────────────────────
    console.log("\n  Deploying EventPassNFT...");
    const EventPassNFT = await ethers.getContractFactory("EventPassNFT");
    const eventPassNFT = await EventPassNFT.deploy(credentialRegistryAddress);
    await eventPassNFT.waitForDeployment();
    const eventPassNFTAddress = await eventPassNFT.getAddress();
    console.log(`  ✅ EventPassNFT deployed at: ${eventPassNFTAddress}`);

    // ─── Summary ───────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  Deployment Summary");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`  CREDENTIAL_REGISTRY_ADDRESS=${credentialRegistryAddress}`);
    console.log(`  REPUTATION_REGISTRY_ADDRESS=${reputationRegistryAddress}`);
    console.log(`  EVENT_PASS_NFT_ADDRESS=${eventPassNFTAddress}`);
    console.log("═══════════════════════════════════════════════════════");
    console.log("\n  Add these addresses to your .env file!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
