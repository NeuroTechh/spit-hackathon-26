const CF_API_BASE = "https://api.cloudflare.com/client/v4";

const getConfig = () => {
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;
    if (!apiToken || !zoneId) {
        throw new Error("Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID environment variables");
    }
    return { apiToken, zoneId };
};

export async function createRoutingRule(
    relayAddress: string,
    destinationEmail: string,
    userId: string
): Promise<string> {
    const { apiToken, zoneId } = getConfig();

    const res = await fetch(`${CF_API_BASE}/zones/${zoneId}/email/routing/rules`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: `Relay for user ${userId}`,
            enabled: true,
            matchers: [{ type: "literal", field: "to", value: relayAddress }],
            actions: [{ type: "forward", value: [destinationEmail] }],
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Cloudflare API error (${res.status}): ${body}`);
    }

    const data = await res.json() as { result: { id: string } };
    return data.result.id;
}

export async function deleteRoutingRule(ruleId: string): Promise<void> {
    const { apiToken, zoneId } = getConfig();

    const res = await fetch(`${CF_API_BASE}/zones/${zoneId}/email/routing/rules/${ruleId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${apiToken}`,
        },
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Cloudflare API error (${res.status}): ${body}`);
    }
}
