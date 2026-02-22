import { query } from '../../config/database';
import { getEventPassNFT, getCredentialRegistry, getReputationRegistry } from '../../blockchain/contracts';
import { sha256 } from '../../utils/crypto';
import { ethers } from 'ethers';
import { resend, FROM_EMAIL } from '../../utils/email';

// ─── Create Event ────────────────────────────────────────────

export const createEvent = async (
    organizerId: string,
    data: {
        title: string;
        description?: string;
        eventDate: string;
        location?: string;
        minAge?: number;
        requiresKyc?: boolean;
        minReputationScore?: number;
        maxAttendees?: number;
    }
) => {
    const result = await query(
        `INSERT INTO events (organizer_id, title, description, event_date, location, min_age, requires_kyc, min_reputation_score, max_attendees)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
        [
            organizerId, data.title, data.description || null,
            new Date(data.eventDate), data.location || null,
            data.minAge || null, data.requiresKyc || false,
            data.minReputationScore || null, data.maxAttendees || null,
        ]
    );

    const event = result.rows[0];

    // Register on-chain
    try {
        const nftContract = getEventPassNFT(true);
        const metadataHash = ethers.id(JSON.stringify({ title: data.title, date: data.eventDate }));

        const tx = await nftContract.createEvent(
            data.title,
            Math.floor(new Date(data.eventDate).getTime() / 1000),
            data.minAge || 0,
            data.requiresKyc || false,
            data.minReputationScore || 0,
            data.maxAttendees || 0,
            metadataHash
        );
        const receipt = await tx.wait();

        // Get event ID from receipt logs
        const eventCounter = await nftContract.eventCounter();

        await query(
            `UPDATE events SET on_chain_event_id = $1, metadata_hash = $2, on_chain_tx_hash = $3, status = 'active' WHERE id = $4`,
            [Number(eventCounter), metadataHash, receipt.hash, event.id]
        );

        event.on_chain_event_id = Number(eventCounter);
        event.on_chain_tx_hash = receipt.hash;
        event.status = 'active';
    } catch (err: any) {
        console.error('On-chain event creation failed:', err.message);
        // Event still exists off-chain
    }

    return event;
};

// ─── List Events ─────────────────────────────────────────────

export const listEvents = async (status?: string) => {
    const whereClause = status ? `WHERE status = $1` : '';
    const params = status ? [status] : [];
    const result = await query(
        `SELECT e.*, u.wallet_address as organizer_wallet, u.display_name as organizer_name
     FROM events e JOIN users u ON u.id = e.organizer_id
     ${whereClause}
     ORDER BY e.event_date ASC`,
        params
    );
    return result.rows;
};

// ─── Get Event ───────────────────────────────────────────────

export const getEvent = async (eventId: string) => {
    const result = await query(
        `SELECT e.*, u.wallet_address as organizer_wallet, u.display_name as organizer_name,
            (SELECT COUNT(*) FROM event_passes WHERE event_id = e.id AND NOT is_burned) as pass_count
     FROM events e JOIN users u ON u.id = e.organizer_id
     WHERE e.id = $1`,
        [eventId]
    );
    if (result.rows.length === 0) throw new Error('Event not found');
    return result.rows[0];
};

// ─── Check Eligibility ──────────────────────────────────────

export const checkEligibility = async (userId: string, eventId: string) => {
    const event = await getEvent(eventId);
    const errors: string[] = [];

    // Check age requirement
    if (event.min_age) {
        const ageCred = await query(
            `SELECT id FROM credentials WHERE user_id = $1 AND credential_type = 'age' AND status = 'active' AND expires_at > NOW()`,
            [userId]
        );
        if (ageCred.rows.length === 0) errors.push(`Age verification required (min age: ${event.min_age})`);
    }

    // Check KYC requirement
    if (event.requires_kyc) {
        const kycCred = await query(
            `SELECT id FROM credentials WHERE user_id = $1 AND credential_type = 'kyc' AND status = 'active' AND expires_at > NOW()`,
            [userId]
        );
        if (kycCred.rows.length === 0) errors.push('KYC verification required');
    }

    // Check reputation requirement
    if (event.min_reputation_score) {
        const repScore = await query(
            `SELECT total_score FROM reputation_scores WHERE user_id = $1`,
            [userId]
        );
        const score = repScore.rows[0]?.total_score || 0;
        if (score < event.min_reputation_score) {
            errors.push(`Minimum reputation score: ${event.min_reputation_score} (yours: ${score})`);
        }
    }

    // Check if already has pass
    const existingPass = await query(
        `SELECT id FROM event_passes WHERE event_id = $1 AND user_id = $2 AND NOT is_burned`,
        [eventId, userId]
    );
    if (existingPass.rows.length > 0) errors.push('Already have a pass for this event');

    return {
        eligible: errors.length === 0,
        errors,
    };
};

// ─── Mint Event Pass (Soulbound NFT) ─────────────────────────

export const mintEventPass = async (userId: string, walletAddress: string, eventId: string) => {
    const eligibility = await checkEligibility(userId, eventId);
    if (!eligibility.eligible) {
        throw new Error(`Not eligible: ${eligibility.errors.join(', ')}`);
    }

    const event = await getEvent(eventId);

    // Check max attendees
    if (event.max_attendees && event.pass_count >= event.max_attendees) {
        throw new Error('Event is full');
    }

    // Get user's active credential hash for the NFT contract (optional for off-chain passes)
    const cred = await query(
        `SELECT credential_hash FROM credentials WHERE user_id = $1 AND status = 'active' AND expires_at > NOW() LIMIT 1`,
        [userId]
    );

    // Mint on-chain (optional — skip if event isn't registered on-chain or user has no wallet)
    let tokenId: number | null = null;
    let mintTxHash: string | null = null;

    if (event.on_chain_event_id && walletAddress && cred.rows.length > 0) {
        try {
            const nftContract = getEventPassNFT(true);
            const tx = await nftContract.mintPass(
                walletAddress,
                event.on_chain_event_id,
                cred.rows[0].credential_hash
            );
            const receipt = await tx.wait();
            mintTxHash = receipt.hash;

            // Parse token ID from event logs
            const mintEvent = receipt.logs?.find((log: any) => log.fragment?.name === 'PassMinted');
            tokenId = mintEvent ? Number(mintEvent.args?.[1]) : null;
        } catch (err: any) {
            console.error('On-chain mint failed:', err.message);
            // Continue — pass will be stored off-chain
        }
    }

    // Store pass in database
    const result = await query(
        `INSERT INTO event_passes (event_id, user_id, token_id, mint_tx_hash)
     VALUES ($1, $2, $3, $4) RETURNING *`,
        [eventId, userId, tokenId, mintTxHash]
    );

    const pass = result.rows[0];

    // Send confirmation email (fire-and-forget)
    (async () => {
        try {
            const userRow = await query(
                `SELECT u.email, u.name FROM "user" u
                 JOIN users ru ON ru.better_auth_user_id = u.id
                 WHERE ru.id = $1`,
                [userId]
            );
            if (userRow.rows.length === 0) return;

            const { email, name } = userRow.rows[0];
            const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            });

            await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: `Your pass for ${event.title} is confirmed!`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; color: #18181b;">
                        <h1 style="font-size: 22px; font-weight: 600;">Pass Confirmed</h1>
                        <p>Hey ${name || 'there'},</p>
                        <p>You're all set for <strong>${event.title}</strong>!</p>
                        <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <p style="margin: 0 0 8px;"><strong>Event:</strong> ${event.title}</p>
                            <p style="margin: 0 0 8px;"><strong>Date:</strong> ${eventDate}</p>
                            <p style="margin: 0 0 8px;"><strong>Location:</strong> ${event.location || 'TBA'}</p>
                            <p style="margin: 0 0 8px;"><strong>Pass ID:</strong> <code>${pass.id}</code></p>
                            ${tokenId != null ? `<p style="margin: 0 0 8px;"><strong>NFT Token ID:</strong> #${tokenId}</p>` : ''}
                            ${mintTxHash ? `<p style="margin: 0;"><strong>Transaction:</strong> <code>${mintTxHash.slice(0, 10)}...${mintTxHash.slice(-8)}</code></p>` : ''}
                        </div>
                        <p style="color: #71717a; font-size: 13px;">This pass is soulbound to your identity and cannot be transferred. Show this email or your pass in the app at check-in.</p>
                    </div>
                `,
            });
        } catch (err: any) {
            console.error('Failed to send pass confirmation email:', err.message);
        }
    })();

    return pass;
};

// ─── Check In ─────────────────────────────────────────────────

export const checkInPass = async (passId: string, organizerId: string) => {
    const pass = await query(
        `SELECT ep.*, e.organizer_id FROM event_passes ep
     JOIN events e ON e.id = ep.event_id
     WHERE ep.id = $1`,
        [passId]
    );

    if (pass.rows.length === 0) throw new Error('Pass not found');
    if (pass.rows[0].organizer_id !== organizerId) throw new Error('Not authorized');
    if (pass.rows[0].is_checked_in) throw new Error('Already checked in');
    if (pass.rows[0].is_burned) throw new Error('Pass is burned');

    // Check in on-chain
    try {
        if (pass.rows[0].token_id != null) {
            const nftContract = getEventPassNFT(true);
            const tx = await nftContract.checkIn(pass.rows[0].token_id);
            await tx.wait();
        }
    } catch (err: any) {
        console.error('On-chain check-in failed:', err.message);
    }

    const result = await query(
        `UPDATE event_passes SET is_checked_in = true, checked_in_at = NOW() WHERE id = $1 RETURNING *`,
        [passId]
    );

    return result.rows[0];
};
