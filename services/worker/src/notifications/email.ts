// AWS SES email notification (uses free tier: 62K emails/month)
// In production, use @aws-sdk/client-ses. For now, a placeholder.

export async function sendEmailNotification(
  message: string,
  severity: string,
  recipientEmail?: string
) {
  // TODO: Implement AWS SES integration
  // For now, log to console
  console.log(`[Email] Would send ${severity} alert to ${recipientEmail || "admin"}: ${message}`);
}
