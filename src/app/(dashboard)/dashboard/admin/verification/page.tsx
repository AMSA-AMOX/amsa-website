"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type VerificationSubmission = {
  id: string;
  userId: number;
  createdAt: string;
  fullName: string;
  pronouns: string | null;
  enrolledUniversity: string;
  yearInSchool: string;
  state: string;
  city: string;
  major: string;
  expectedGraduation: string;
  email: string;
  socialMedia: string;
  phone: string;
  careerInterests: string[];
  careerInterestsOther: string | null;
  amsaInterests: string[];
  amsaInterestsOther: string | null;
  mentorshipInterest: string;
  eventIdeas: string | null;
  heardAboutAmsa: string;
  heardAboutAmsaOther: string | null;
  agreesToEmails: boolean;
  reviewStatus: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  reviewedBy: number | null;
  assignedRole: "us_member" | "member" | null;
  adminNote: string | null;
  user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    acceptanceStatus: string | null;
  } | null;
  reviewer: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    acceptanceStatus: string | null;
  } | null;
};

type FilterStatus = "pending" | "approved" | "rejected" | "all";

const statusTabs: FilterStatus[] = ["pending", "approved", "rejected", "all"];

export default function AdminVerificationPage() {
  const router = useRouter();
  const { user, loading, authFetch } = useAuth();

  const [status, setStatus] = useState<FilterStatus>("pending");
  const [submissions, setSubmissions] = useState<VerificationSubmission[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, "us_member" | "member">>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => submissions.filter((submission) => submission.reviewStatus === "pending").length,
    [submissions],
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "admin") {
      router.push("/welcome");
      return;
    }
    void loadSubmissions(status);
  }, [loading, user, status, router]);

  const loadSubmissions = async (nextStatus: FilterStatus) => {
    setLoadingSubmissions(true);
    setError(null);
    try {
      const data = await authFetch(`/api/admin/verification?status=${nextStatus}`);
      const rows = (data?.submissions ?? []) as VerificationSubmission[];
      setSubmissions(rows);
      setExpandedSubmissionId((prev) =>
        prev && rows.some((row) => row.id === prev) ? prev : null,
      );
      setSelectedRoles((prev) => {
        const next = { ...prev };
        for (const row of rows) {
          if (!next[row.id] && row.assignedRole) {
            next[row.id] = row.assignedRole;
          } else if (!next[row.id]) {
            next[row.id] = "member";
          }
        }
        return next;
      });
      setAdminNotes((prev) => {
        const next = { ...prev };
        for (const row of rows) {
          if (next[row.id] === undefined) {
            next[row.id] = row.adminNote ?? "";
          }
        }
        return next;
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load submissions");
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const reviewSubmission = async (
    submission: VerificationSubmission,
    reviewStatus: "approved" | "rejected",
  ) => {
    setActionId(submission.id);
    setError(null);
    try {
      await authFetch(`/api/admin/verification/${submission.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          reviewStatus,
          assignedRole: reviewStatus === "approved" ? selectedRoles[submission.id] ?? "member" : undefined,
          adminNote: adminNotes[submission.id] ?? "",
        }),
      });
      await loadSubmissions(status);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update submission");
    } finally {
      setActionId(null);
    }
  };

  if (!user) return null;
  if (user.role !== "admin") return null;

  return (
    <div className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#001049]">Verification Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review verification forms, assign role, and approve or reject users.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                status === tab ? "bg-[#001049] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab === "all" ? "All" : tab[0].toUpperCase() + tab.slice(1)}
              {tab === "pending" ? ` (${pendingCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loadingSubmissions ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-white rounded-xl border border-gray-100" />
          <div className="h-24 bg-white rounded-xl border border-gray-100" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
          No submissions for this status.
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <article key={submission.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSubmissionId((prev) =>
                      prev === submission.id ? null : submission.id,
                    )
                  }
                  className="flex-1 min-w-0 text-left"
                >
                  <h2 className="text-lg font-semibold text-[#001049] truncate">{submission.fullName}</h2>
                  <p className="text-xs text-gray-500 mt-1">User ID {submission.userId}</p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSubmissionId((prev) =>
                      prev === submission.id ? null : submission.id,
                    )
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                >
                  {expandedSubmissionId === submission.id ? "Collapse" : "Expand"}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 transition-transform ${
                      expandedSubmissionId === submission.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>

              {expandedSubmissionId === submission.id && (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                      Submitted {new Date(submission.createdAt).toLocaleString()}
                    </p>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        submission.reviewStatus === "approved"
                          ? "bg-green-100 text-green-700"
                          : submission.reviewStatus === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {submission.reviewStatus}
                    </span>
                  </div>

                  <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <Info label="Email" value={submission.email} />
                    <Info label="Phone" value={submission.phone} />
                    <Info label="Pronouns" value={submission.pronouns || "-"} />
                    <Info label="University" value={submission.enrolledUniversity} />
                    <Info label="Year in School" value={submission.yearInSchool} />
                    <Info label="Major" value={submission.major} />
                    <Info label="Expected Graduation" value={submission.expectedGraduation} />
                    <Info label="Location" value={`${submission.city}, ${submission.state}`} />
                    <Info label="Mentorship Interest" value={submission.mentorshipInterest} />
                  </div>

                  <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
                    <Info
                      label="Career Interests"
                      value={[
                        submission.careerInterests.join(", "),
                        submission.careerInterestsOther ? `Other: ${submission.careerInterestsOther}` : "",
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                    />
                    <Info
                      label="AMSA Interests"
                      value={[
                        submission.amsaInterests.join(", "),
                        submission.amsaInterestsOther ? `Other: ${submission.amsaInterestsOther}` : "",
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                    />
                    <Info
                      label="Heard About AMSA"
                      value={[
                        submission.heardAboutAmsa,
                        submission.heardAboutAmsaOther ? `Other: ${submission.heardAboutAmsaOther}` : "",
                      ]
                        .filter(Boolean)
                        .join(" | ")}
                    />
                    <Info label="Social Media" value={submission.socialMedia} />
                  </div>

                  {submission.eventIdeas && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Event Ideas</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.eventIdeas}</p>
                    </div>
                  )}

                  <div className="mt-4 grid md:grid-cols-[220px_1fr] gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assign Role</label>
                      <select
                        value={selectedRoles[submission.id] ?? "member"}
                        onChange={(e) =>
                          setSelectedRoles((prev) => ({
                            ...prev,
                            [submission.id]: e.target.value as "us_member" | "member",
                          }))
                        }
                        disabled={submission.reviewStatus !== "pending" || actionId === submission.id}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001049]/20"
                      >
                        <option value="member">Member</option>
                        <option value="us_member">US Member</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin Note</label>
                      <textarea
                        rows={2}
                        value={adminNotes[submission.id] ?? ""}
                        onChange={(e) =>
                          setAdminNotes((prev) => ({ ...prev, [submission.id]: e.target.value }))
                        }
                        disabled={submission.reviewStatus !== "pending" || actionId === submission.id}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001049]/20 resize-none"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => reviewSubmission(submission, "approved")}
                      disabled={submission.reviewStatus !== "pending" || actionId === submission.id}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewSubmission(submission, "rejected")}
                      disabled={submission.reviewStatus !== "pending" || actionId === submission.id}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5 break-words">{value || "-"}</p>
    </div>
  );
}
