import "server-only";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

type TemplateKey =
  | "reservation_confirmation"
  | "waitlist_placed"
  | "waitlist_promoted"
  | "reservation_expired";

type EventEmailInput = {
  eventId: number;
  userId: number;
  userEmail: string;
  templateKey: TemplateKey;
  dedupeKey: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
};

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "administration@amsa.mn";
const welcomeFromEmail = process.env.RESEND_WELCOME_FROM || fromEmail;
const welcomeTemplateId = process.env.RESEND_WELCOME_TEMPLATE_ID;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export function buildEventEmailHtml(input: {
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const cta = input.ctaText && input.ctaUrl
    ? `<p><a href="${input.ctaUrl}" style="display:inline-block;padding:10px 14px;background:#001049;color:#fff;border-radius:8px;text-decoration:none;">${input.ctaText}</a></p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <h2 style="margin-bottom:12px;">${input.title}</h2>
      <p>${input.body}</p>
      ${cta}
      <p style="margin-top:20px;color:#666;font-size:13px;">AMSA Events</p>
    </div>
  `;
}

/**
 * Sends the welcome email on signup using the published Resend dashboard
 * template referenced by RESEND_WELCOME_TEMPLATE_ID. Failures are logged and
 * swallowed so they never block the signup flow.
 */
export async function sendWelcomeEmail(input: {
  userEmail: string;
  firstName: string;
}): Promise<void> {
  if (!resend) {
    console.warn("Skipping welcome email: RESEND_API_KEY is not configured");
    return;
  }
  if (!welcomeTemplateId) {
    console.warn("Skipping welcome email: RESEND_WELCOME_TEMPLATE_ID is not configured");
    return;
  }

  const result = await resend.emails.send({
    from: welcomeFromEmail,
    to: input.userEmail,
    template: {
      id: welcomeTemplateId,
      variables: {
        firstName: input.firstName,
      },
    },
  });

  if (result.error) {
    console.error("Failed to send welcome email with Resend:", result.error.message);
  }
}

/**
 * Sends the password-reset link. Failures are logged and swallowed so the
 * forgot-password endpoint never reveals whether an account exists.
 */
export async function sendPasswordResetEmail(input: {
  userEmail: string;
  firstName?: string;
  resetUrl: string;
}): Promise<void> {
  if (!resend) {
    console.warn("Skipping password reset email: RESEND_API_KEY is not configured");
    return;
  }

  const greeting = input.firstName ? `Hi ${input.firstName},` : "Hi,";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <h2 style="margin-bottom:12px;">Reset your AMSA password</h2>
      <p>${greeting}</p>
      <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
      <p><a href="${input.resetUrl}" style="display:inline-block;padding:10px 14px;background:#001049;color:#fff;border-radius:8px;text-decoration:none;">Reset password</a></p>
      <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
      <p style="margin-top:20px;color:#666;font-size:13px;">AMSA</p>
    </div>
  `;

  const result = await resend.emails.send({
    from: fromEmail,
    to: input.userEmail,
    subject: "Reset your AMSA password",
    html,
  });

  if (result.error) {
    console.error("Failed to send password reset email with Resend:", result.error.message);
  }
}

export async function sendEventEmail(input: EventEmailInput): Promise<void> {
  const { data: existing } = await supabase
    .from("EventEmails")
    .select("id")
    .eq("dedupeKey", input.dedupeKey)
    .maybeSingle();

  if (existing) return;

  if (!resend) {
    console.warn("Skipping event email send: RESEND_API_KEY is not configured");
    return;
  }

  const result = await resend.emails.send({
    from: fromEmail,
    to: input.userEmail,
    subject: input.subject,
    html: input.html,
  });

  if (result.error) {
    console.error("Failed to send email with Resend:", result.error.message);
    return;
  }

  const { error: logError } = await supabase.from("EventEmails").insert({
    eventId: input.eventId,
    userId: input.userId,
    templateKey: input.templateKey,
    dedupeKey: input.dedupeKey,
    metadata: {
      ...(input.metadata || {}),
      resendId: result.data?.id ?? null,
    },
  });

  if (logError) {
    console.error("Failed to write EventEmails log:", logError.message);
  }
}
