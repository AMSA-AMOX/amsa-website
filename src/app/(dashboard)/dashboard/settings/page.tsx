"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type MeUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string | null;
  profilePic: string | null;
  headline: string | null;
  phoneNumber: string | null;
  personalEmail: string | null;
  city: string | null;
  state: string | null;
  schoolName: string | null;
  schoolEmail: string | null;
  major: string | null;
  degreeLevel: string | null;
  schoolYear: string | null;
  graduationYear: string | number | null;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  board_member: "Board Member",
  ambassador: "Ambassador",
  us_member: "US Member",
  alum: "Alum",
  member: "Member",
};

/** Must match CONFIRMATION_WORD in src/app/api/user/account/route.ts. */
const CONFIRMATION_WORD = "DELETE";

const formatMemberSince = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—";

export default function SettingsPage() {
  const { user, loading, authFetch, logout } = useAuth();
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setLoadingMe(true);
    setLoadError("");
    authFetch("/api/auth/me")
      .then((res) => setMe(res.user))
      .catch((err: any) => setLoadError(err?.message ?? "Couldn't load your account."))
      .finally(() => setLoadingMe(false));
  }, [loading, user, authFetch, router]);

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const location = [me?.city, me?.state].filter(Boolean).join(", ");

  const accountRows: [string, React.ReactNode][] = [
    ["Name", me ? `${me.firstName} ${me.lastName}`.trim() : ""],
    ["Email", me?.email],
    ["Role", ROLE_LABELS[me?.role ?? ""] ?? "Member"],
    ["Member since", formatMemberSince(me?.createdAt ?? null)],
  ];

  const profileRows: [string, React.ReactNode][] = [
    ["Headline", me?.headline],
    ["School", me?.schoolName],
    ["School email", me?.schoolEmail],
    ["Major", me?.major],
    ["Degree", me?.degreeLevel],
    ["Year", me?.schoolYear],
    ["Graduation year", me?.graduationYear],
    ["Location", location],
    ["Phone", me?.phoneNumber],
    ["Personal email", me?.personalEmail],
  ];

  return (
    <div className="py-10 px-4 md:px-80">
      {loadingMe && (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="divide-y-2 divide-gray-300">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between py-4">
                <div className="h-4 bg-gray-200 rounded w-1/5" />
                <div className="h-4 bg-gray-200 rounded w-2/5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadingMe && loadError && (
        <p className="text-sm text-red-600">{loadError}</p>
      )}

      {!loadingMe && me && (
        <div className="space-y-10">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-lg font-bold shrink-0 overflow-hidden">
              {me.profilePic ? (
                <img src={me.profilePic} alt={`${me.firstName} ${me.lastName}`.trim()} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-gray-900 truncate">{me.firstName} {me.lastName}</p>
              <p className="text-sm text-gray-500 truncate">{me.email}</p>
            </div>
          </div>

          <section>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-400 mb-3">Account</h2>
            <InfoRows rows={accountRows} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-400">Profile</h2>
              <Link href="/welcome" className="text-sm font-semibold text-[#001049] hover:underline">
                Edit profile
              </Link>
            </div>
            <InfoRows rows={profileRows} />
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-red-500 mb-3">Danger zone</h2>
            <div className="border-t-2 border-gray-300 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-gray-900">Delete account</p>
                <p className="text-sm text-gray-500 mt-1">
                  {isAdmin
                    ? "Admin accounts can't be deleted from settings. Ask another admin to change your role first."
                    : "Permanently removes your profile, posts, questions, comments, reviews, and event reservations. This can't be undone."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={isAdmin}
                className="shrink-0 px-5 py-2 rounded-lg border-2 border-red-500 text-red-600 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Delete account
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmOpen && (
        <DeleteAccountDialog
          onClose={() => setConfirmOpen(false)}
          onDeleted={() => {
            logout();
            router.push("/");
          }}
        />
      )}
    </div>
  );
}

function InfoRows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y-2 divide-gray-300">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-6 py-3">
          <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
          <dd className={`text-sm text-right break-words min-w-0 ${value ? "text-gray-900" : "text-gray-400"}`}>
            {value || "Not set"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Second confirmation layer: the user has to type DELETE before the button
 * enables. The API checks the same word again.
 */
function DeleteAccountDialog({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) {
  const { authFetch } = useAuth();
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const confirmed = typed === CONFIRMATION_WORD;

  const close = () => {
    if (deleting) return;
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleting]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;
    setDeleting(true);
    setError("");
    try {
      await authFetch("/api/user/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: typed }),
      });
      onDeleted();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
      setDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="delete-account-title" className="text-lg font-bold text-gray-900">Delete your account?</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-700">
            This permanently deletes your account and everything tied to it — profile, posts, questions and comments,
            reviews, and event reservations. There is no way to recover it afterwards.
          </p>

          <div className="flex flex-col gap-1">
            <label htmlFor="delete-confirmation" className="text-sm font-semibold text-gray-700">
              Type <span className="font-mono">{CONFIRMATION_WORD}</span> to confirm
            </label>
            <input
              id="delete-confirmation"
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={CONFIRMATION_WORD}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white transition font-mono"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={close}
              disabled={deleting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmed || deleting}
              className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40 disabled:hover:bg-red-600"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
