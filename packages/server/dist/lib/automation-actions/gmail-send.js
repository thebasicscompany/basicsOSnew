export async function executeGmailSend(config, _context, apiKey, env) {
    const { to, subject, body } = config;
    const response = await fetch(`${env.BASICOS_API_URL}/v1/execute/gmail/send`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ to, subject, body }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gmail send failed (${response.status}): ${text}`);
    }
}
