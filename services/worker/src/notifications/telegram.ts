const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_DEFAULT_CHAT_ID || "";

const SEVERITY_ICONS: Record<string, string> = {
  critical: "🔴",
  warning: "🟡",
  info: "🔵",
};

export async function sendTelegramNotification(
  message: string,
  severity: string,
  chatId?: string
) {
  const targetChatId = chatId || TELEGRAM_CHAT_ID;
  if (!TELEGRAM_BOT_TOKEN || !targetChatId) {
    console.warn("[Telegram] Bot token or chat ID not configured, skipping");
    return;
  }

  const icon = SEVERITY_ICONS[severity] || "ℹ️";
  const text = `${icon} *Smart WaterVerse Alert*\n\n*Severity:* ${severity.toUpperCase()}\n*Message:* ${message}\n*Time:* ${new Date().toISOString()}`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: targetChatId,
      text,
      parse_mode: "Markdown",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram API error: ${response.status} ${body}`);
  }
}
