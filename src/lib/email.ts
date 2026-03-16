/**
 * Email sending via Resend API.
 *
 * Env vars:
 *   RESEND_API_KEY    — Resend API key (required to send)
 *   EMAIL_FROM        — Override default From address (optional)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM || "MakeATale <noreply@makeatale.com>";
const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Branded HTML email template wrapper.
 * Dark background, purple accent, MakeATale branding.
 */
export function wrapEmailTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MakeATale</title>
</head>
<body style="margin:0;padding:0;background-color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111827;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#1f2937;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#9333ea,#7c3aed);padding:24px 32px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                MakeATale
              </h1>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:1px;text-transform:uppercase;">
                Collaborative Storytelling
              </p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #374151;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                <a href="https://makeatale.com" style="color:#a78bfa;text-decoration:none;">makeatale.com</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#4b5563;">
                You received this because of your notification settings.
                <a href="https://makeatale.com/account" style="color:#6b7280;text-decoration:underline;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send an email via the Resend API.
 * Fire-and-forget — never throws, never blocks the caller.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!RESEND_API_KEY) return; // Gracefully skip if not configured

  try {
    fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        subject,
        html,
      }),
    }).catch(() => {
      // Swallow network errors — email is non-critical
    });
  } catch {
    // Non-critical — don't break the parent operation
  }
}
