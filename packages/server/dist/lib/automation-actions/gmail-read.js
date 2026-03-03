export async function executeGmailRead(config, _context, apiKey, env) {
    const { query = "is:unread", maxResults = 5 } = config;
    const response = await fetch(`${env.BASICOS_API_URL}/v1/execute/gmail/read`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query, maxResults }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gmail read failed (${response.status}): ${text}`);
    }
    const data = (await response.json());
    return { gmail_messages: data.messages };
}
