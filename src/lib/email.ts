import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "SponsorAtlas <noreply@sponsoratlas.app>";

// Without a RESEND_API_KEY (local dev / demo mode) we log the link instead of
// sending, so the auth flows are fully testable with zero email config.
async function send(to: string, subject: string, html: string, logLabel: string) {
  if (!resend) {
    console.log(`[email:${logLabel}] would send to ${to}: ${subject}\n${html}`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  await send(
    to,
    "Verify your SponsorAtlas email",
    `<p>Welcome to SponsorAtlas! Confirm your email address to activate your account:</p>
     <p><a href="${verifyUrl}">${verifyUrl}</a></p>
     <p>This link expires in 24 hours.</p>`,
    "verify-email"
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await send(
    to,
    "Reset your SponsorAtlas password",
    `<p>We received a request to reset your password. This link expires in 1 hour:</p>
     <p><a href="${resetUrl}">${resetUrl}</a></p>
     <p>If you didn't request this, you can safely ignore this email.</p>`,
    "password-reset"
  );
}
