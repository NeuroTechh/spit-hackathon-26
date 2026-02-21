// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CredentialRegistry.sol";

/// @title EventPassNFT — Soulbound Event Pass NFTs
/// @notice Non-transferable ERC721 tokens that require valid credentials to mint.
///         Burned on fraud detection. Cannot be resold or transferred.
contract EventPassNFT is ERC721, Ownable {

    // ─── State ───────────────────────────────────────────────

    CredentialRegistry public credentialRegistry;
    uint256 private _nextTokenId;
    uint256 public eventCounter;

    struct Event {
        string name;
        uint256 date;
        uint256 minAge;             // 0 = no age requirement
        bool requiresKYC;
        uint256 minReputationScore; // 0 = no reputation requirement
        uint256 maxAttendees;
        uint256 mintedCount;
        bytes32 metadataHash;       // IPFS hash for event metadata
        address organizer;
        bool exists;
        bool cancelled;
    }

    struct Pass {
        uint256 eventId;
        address holder;
        bool isCheckedIn;
        uint256 checkedInAt;
        bool isBurned;
    }

    // eventId => Event
    mapping(uint256 => Event) public events;

    // tokenId => Pass
    mapping(uint256 => Pass) public passes;

    // holder => eventId => has pass (prevent duplicates)
    mapping(address => mapping(uint256 => bool)) public hasPass;

    // holder => eventId => tokenId
    mapping(address => mapping(uint256 => uint256)) public userEventToken;

    // ─── Events ──────────────────────────────────────────────

    event EventCreated(uint256 indexed eventId, string name, address indexed organizer);
    event EventCancelled(uint256 indexed eventId);
    event PassMinted(address indexed to, uint256 indexed tokenId, uint256 indexed eventId);
    event PassCheckedIn(uint256 indexed tokenId, uint256 timestamp);
    event PassBurned(uint256 indexed tokenId, string reason);

    // ─── Constructor ─────────────────────────────────────────

    constructor(address _credentialRegistry)
        ERC721("RacePass Event Ticket", "RPET")
        Ownable(msg.sender)
    {
        credentialRegistry = CredentialRegistry(_credentialRegistry);
    }

    // ─── Soulbound: Prevent ALL transfers ────────────────────

    /// @notice Override _update to make tokens soulbound (non-transferable)
    /// @dev Only allows minting (from = address(0)) and burning (to = address(0))
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == 0) and burning (to == 0)
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: transfers disabled");
        }

        return super._update(to, tokenId, auth);
    }

    // ─── Event Management ────────────────────────────────────

    /// @notice Create a new event with eligibility requirements
    function createEvent(
        string calldata name,
        uint256 date,
        uint256 minAge,
        bool requiresKYC,
        uint256 minReputationScore,
        uint256 maxAttendees,
        bytes32 metadataHash
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(date > block.timestamp, "Event must be in the future");

        eventCounter++;
        events[eventCounter] = Event({
            name: name,
            date: date,
            minAge: minAge,
            requiresKYC: requiresKYC,
            minReputationScore: minReputationScore,
            maxAttendees: maxAttendees,
            mintedCount: 0,
            metadataHash: metadataHash,
            organizer: msg.sender,
            exists: true,
            cancelled: false
        });

        emit EventCreated(eventCounter, name, msg.sender);
        return eventCounter;
    }

    /// @notice Cancel an event (only organizer or owner)
    function cancelEvent(uint256 eventId) external {
        Event storage evt = events[eventId];
        require(evt.exists, "Event does not exist");
        require(
            msg.sender == evt.organizer || msg.sender == owner(),
            "Not authorized"
        );
        evt.cancelled = true;
        emit EventCancelled(eventId);
    }

    // ─── Pass Operations ─────────────────────────────────────

    /// @notice Mint a soulbound event pass
    /// @param to Wallet address to mint to
    /// @param eventId Event ID to mint pass for
    /// @param credentialHash Credential hash that proves eligibility
    function mintPass(
        address to,
        uint256 eventId,
        bytes32 credentialHash
    ) external {
        Event storage evt = events[eventId];
        require(evt.exists, "Event does not exist");
        require(!evt.cancelled, "Event cancelled");
        require(!hasPass[to][eventId], "Already has pass");
        require(
            evt.maxAttendees == 0 || evt.mintedCount < evt.maxAttendees,
            "Event full"
        );

        // Verify credential is valid on-chain
        require(
            credentialRegistry.verifyCredential(credentialHash),
            "Invalid or expired credential"
        );

        // Only event organizer or contract owner can mint
        require(
            msg.sender == evt.organizer || msg.sender == owner(),
            "Not authorized to mint"
        );

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        passes[tokenId] = Pass({
            eventId: eventId,
            holder: to,
            isCheckedIn: false,
            checkedInAt: 0,
            isBurned: false
        });

        hasPass[to][eventId] = true;
        userEventToken[to][eventId] = tokenId;
        evt.mintedCount++;

        emit PassMinted(to, tokenId, eventId);
    }

    /// @notice Check in a pass holder at the event
    function checkIn(uint256 tokenId) external {
        Pass storage pass = passes[tokenId];
        require(pass.holder != address(0), "Pass does not exist");
        require(!pass.isBurned, "Pass is burned");
        require(!pass.isCheckedIn, "Already checked in");

        Event memory evt = events[pass.eventId];
        require(
            msg.sender == evt.organizer || msg.sender == owner(),
            "Not authorized"
        );

        pass.isCheckedIn = true;
        pass.checkedInAt = block.timestamp;

        emit PassCheckedIn(tokenId, block.timestamp);
    }

    /// @notice Burn a pass on fraud detection (only owner)
    function burnOnFraud(uint256 tokenId, string calldata reason) external onlyOwner {
        Pass storage pass = passes[tokenId];
        require(pass.holder != address(0), "Pass does not exist");
        require(!pass.isBurned, "Already burned");

        pass.isBurned = true;
        hasPass[pass.holder][pass.eventId] = false;

        _burn(tokenId);

        emit PassBurned(tokenId, reason);
    }

    // ─── View Functions ──────────────────────────────────────

    function getEvent(uint256 eventId) external view returns (Event memory) {
        return events[eventId];
    }

    function getPass(uint256 tokenId) external view returns (Pass memory) {
        return passes[tokenId];
    }

    function getUserPassForEvent(address user, uint256 eventId) external view returns (uint256) {
        require(hasPass[user][eventId], "No pass found");
        return userEventToken[user][eventId];
    }
}
