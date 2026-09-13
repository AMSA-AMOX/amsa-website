"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES = ["Bug", "Idea", "Question", "Other"] as const;
type Category = (typeof CATEGORIES)[number];

const MAX_LEN = 2000;

/**
 * Sidebar entry that opens a small modal and emails the submission to the
 * admins (POST /api/feedback → Resend). No data is stored in the app.
 */
export default function FeedbackButton() {
  const pathname = usePathname();
  const { authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("Idea");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (sending) return;
    setOpen(false);
  };

  // Reset the form each time the dialog is opened fresh.
  useEffect(() => {
    if (open) {
      setSent(false);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sending]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await authFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ category, message: message.trim(), page: pathname }),
      });
      setSent(true);
      setMessage("");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
        Send feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 id="feedback-title" className="text-lg font-bold text-gray-900">Send feedback</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {sent ? (
              <div className="px-6 py-10 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-gray-900">Thanks — we got it.</p>
                <p className="text-sm text-gray-500">The AMSA team will reply to your account email if needed.</p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-2 px-5 py-2 rounded-xl bg-[#001049] text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <p className="text-sm text-gray-500">
                  Found a bug, have an idea, or need help? This goes straight to the AMSA admins.
                </p>

                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
                        category === c
                          ? "bg-[#001049] border-[#001049] text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:border-gray-500"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="feedback-message" className="text-sm font-semibold text-gray-700">Message</label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_LEN))}
                    rows={6}
                    required
                    minLength={10}
                    autoFocus
                    placeholder="What happened, or what would you like to see?"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001049]/20 focus:border-[#001049] bg-white transition resize-none"
                  />
                  <p className="text-xs text-gray-400 text-right">{message.length}/{MAX_LEN}</p>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    disabled={sending}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || message.trim().length < 10}
                    className="px-5 py-2 rounded-xl bg-[#001049] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
