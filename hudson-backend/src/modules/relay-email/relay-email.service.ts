import crypto from "crypto";
import { query } from "../../config/database";
import { createRoutingRule } from "./cloudflare-email.service";

const RELAY_DOMAIN = process.env.RELAY_EMAIL_DOMAIN || "relay.neurotechh.xyz";

export function generateRelayAddress(): string {
    const hash = crypto.randomBytes(8).toString("hex");
    return `relay-${hash}@${RELAY_DOMAIN}`;
}

export async function provisionRelayEmail(userId: string, destinationEmail: string): Promise<string> {
    const relayAddress = generateRelayAddress();

    const ruleId = await createRoutingRule(relayAddress, destinationEmail, userId);

    await query(
        "UPDATE users SET relay_email = $1, cf_routing_rule_id = $2, updated_at = NOW() WHERE id = $3",
        [relayAddress, ruleId, userId]
    );

    return relayAddress;
}
