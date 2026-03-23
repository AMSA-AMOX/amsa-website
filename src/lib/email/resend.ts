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
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@amsa.mn";
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
