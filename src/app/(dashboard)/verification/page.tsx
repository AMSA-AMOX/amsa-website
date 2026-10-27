"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { invalidateShell } from "@/hooks/useShell";
import {
  AMSA_INTEREST_OPTIONS,
  CAREER_INTEREST_OPTIONS,
  HEARD_ABOUT_AMSA_OPTIONS,
  MENTORSHIP_INTEREST_OPTIONS,
  normalizeInstagramHandle,
  type MembershipSubmissionPayload,
} from "@/lib/membership";

type MembershipResponse = MembershipSubmissionPayload & {
  id: string;
  reviewStatus: string;
  assignedRole: string | null;
  adminNote: string;
};

type ProfileSnapshot = {
  firstName?: string | null;
  lastName?: string | null;
  schoolName?: string | null;
  schoolEmail?: string | null;
  schoolYear?: string | null;
  major?: string | null;
  graduationYear?: string | null;
  state?: string | null;
  city?: string | null;
  phoneNumber?: string | null;
  instagram?: string | null;
  facebook?: string | null;
};

const YEAR_IN_SCHOOL_OPTIONS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate Student",
  "Other",
];

const emptyForm: MembershipSubmissionPayload = {
  fullName: "",
  pronouns: "",
  enrolledUniversity: "",
  yearInSchool: "",
  state: "",
  city: "",
  major: "",
  expectedGraduation: "",
  email: "",
  socialMedia: "",
  phone: "",
  careerInterests: [],
  careerInterestsOther: "",
  amsaInterests: [],
  amsaInterestsOther: "",
  mentorshipInterest: "",
  eventIdeas: "",
  heardAboutAmsa: "",
  heardAboutAmsaOther: "",
};

export default function VerificationPage() {
  const router = useRouter();
  const { user, authFetch, loading } = useAuth();

  const [form, setForm] = useState<MembershipSubmissionPayload>(emptyForm);
  const [reviewStatus, setReviewStatus] = useState<string>("pending");
  const [loadingForm, setLoadingForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isLocked = reviewStatus === "approved";

  // Live check: does the .edu email belong to the university they typed?
  type EmailCheck = { status: "match" | "mismatch" | "unknown"; college: { id: number; name: string } | null };
  const [emailCheck, setEmailCheck] = useState<EmailCheck | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    if (isLocked || loadingForm) return;
    const email = form.email.trim().toLowerCase();
    if (!email.includes("@") || !email.endsWith(".edu")) {
      setEmailCheck(null);
      return;
    }
    let cancelled = false;
    setCheckingEmail(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ email, name: form.enrolledUniversity.trim() });
      authFetch(`/api/colleges/match?${params.toString()}`)
        .then((res) => { if (!cancelled) setEmailCheck(res as EmailCheck); })
        .catch(() => { if (!cancelled) setEmailCheck(null); })
        .finally(() => { if (!cancelled) setCheckingEmail(false); });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.email, form.enrolledUniversity, isLocked, loadingForm, authFetch]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const load = async () => {
      setLoadingForm(true);
      setError("");
      try {
        const [data, meData] = await Promise.all([
          authFetch("/api/user/verification"),
          authFetch("/api/auth/me").catch(() => null),
        ]);
        const membership = data?.membership as MembershipResponse | null;
        const profile = (meData?.user ?? null) as ProfileSnapshot | null;

        if (membership) {
          setForm({
            fullName: membership.fullName ?? "",
            pronouns: membership.pronouns ?? "",
            enrolledUniversity: membership.enrolledUniversity ?? "",
            yearInSchool: membership.yearInSchool ?? "",
            state: membership.state ?? "",
            city: membership.city ?? "",
            major: membership.major ?? "",
            expectedGraduation: membership.expectedGraduation ?? "",
            email: membership.email ?? profile?.schoolEmail ?? "",
            socialMedia: membership.socialMedia ?? "",
            phone: membership.phone ?? "",
            careerInterests: membership.careerInterests ?? [],
            careerInterestsOther: membership.careerInterestsOther ?? "",
            amsaInterests: membership.amsaInterests ?? [],
            amsaInterestsOther: membership.amsaInterestsOther ?? "",
            mentorshipInterest: membership.mentorshipInterest ?? "",
            eventIdeas: membership.eventIdeas ?? "",
            heardAboutAmsa: membership.heardAboutAmsa ?? "",
            heardAboutAmsaOther: membership.heardAboutAmsaOther ?? "",
          });
          setReviewStatus(membership.reviewStatus ?? "pending");
        } else {
          // First-time applicant: pre-fill whatever is already on the profile so
          // the two stay in sync (submitting writes these back to the profile).
          setForm((prev) => ({
            ...prev,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
            enrolledUniversity: profile?.schoolName ?? "",
            yearInSchool: YEAR_IN_SCHOOL_OPTIONS.includes(profile?.schoolYear ?? "")
              ? (profile?.schoolYear as string)
              : "",
            major: profile?.major ?? "",
            expectedGraduation: profile?.graduationYear ?? "",
            state: profile?.state ?? "",
            city: profile?.city ?? "",
            email: profile?.schoolEmail ?? "",
            phone: profile?.phoneNumber ?? "",
            socialMedia: normalizeInstagramHandle(profile?.instagram),
          }));
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load US Member application.");
      } finally {
        setLoadingForm(false);
      }
    };

    void load();
  }, [loading, user, authFetch, router]);

  const requiresCareerOther = useMemo(() => form.careerInterests.includes("Other:"), [form.careerInterests]);
  const requiresAmsaOther = useMemo(
    () => form.amsaInterests.includes("Other"),
    [form.amsaInterests],
  );
  const requiresHeardOther = useMemo(
    () => form.heardAboutAmsa === "Other",
    [form.heardAboutAmsa],
  );

  const toggleMultiSelect = (
    key: "careerInterests" | "amsaInterests",
    value: string,
  ) => {
    setForm((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const updateField = <K extends keyof MembershipSubmissionPayload>(
    key: K,
    value: MembershipSubmissionPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLocked) return;

    if (!form.email.toLowerCase().endsWith(".edu")) {
      setError("Please enter a valid school email address ending in .edu");
      return;
    }

    if (emailCheck?.status === "mismatch" && emailCheck.college) {
      setError(
        `Your school email belongs to ${emailCheck.college.name}, but you entered "${form.enrolledUniversity}". Please use an email from that university or correct the university name.`,
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload: MembershipSubmissionPayload = {
        ...form,
        careerInterestsOther: requiresCareerOther ? form.careerInterestsOther : "",
        amsaInterestsOther: requiresAmsaOther ? form.amsaInterestsOther : "",
        heardAboutAmsaOther: requiresHeardOther ? form.heardAboutAmsaOther : "",
      };

      const data = await authFetch("/api/user/verification", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setReviewStatus(data?.membership?.reviewStatus ?? "pending");
      if (data?.membership?.enrolledUniversity) {
        setForm((prev) => ({ ...prev, enrolledUniversity: data.membership.enrolledUniversity }));
      }
      invalidateShell();
      setSuccess("US Member application submitted. Admins can now review your application.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit US Member application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="py-10 px-6 md:px-12 max-w-5xl mx-auto">

      {/* Intro */}
      <div className="mb-8 space-y-2">
        <p className="text-base text-gray-500">
          {user.role === "board_member"
            ? "All board members are required to complete this US Member application. Submitting it will not change your board member role."
            : "Use this form to apply for US Member status. Your submission is linked to your account and reviewed by admins."}
        </p>
        <p className="text-sm text-gray-400">
          The school, major, graduation, location and contact details you enter here are saved to your profile as well.
        </p>
        {reviewStatus === "approved" && (
          <p className="text-base font-semibold text-green-700">Your application has been approved.</p>
        )}
      </div>

      {/* About AMSA */}
      <div className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-400">About AMSA</h2>
        <p className="text-base text-gray-700 leading-relaxed">
          The Association of Mongolian Students in America (AMSA), founded in 2011, connects Mongolian students pursuing higher education in the United States. As a non-profit organization, AMSA has built a strong network of over 12,000 students and alumni, led by 8 board members.
        </p>
        <p className="text-base text-gray-700 leading-relaxed">
          AMSA includes 1,100+ active members across the U.S. and organizes key programs such as:
        </p>
        <ul className="list-disc pl-5 text-base text-gray-700 space-y-1.5">
          <li>Change Your Future (CYF) — introducing high school students to U.S. study opportunities</li>
          <li>Best University Opportunity Program (BUOP) — preparing students for college applications and scholarships</li>
          <li>Annual General Meeting (AGM) — bringing students together for networking and community</li>
        </ul>
      </div>

      <div className="border-t-2 border-gray-300 mb-8" />

      {loadingForm ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg" />
          <div className="h-12 bg-gray-200 rounded-lg" />
          <div className="h-32 bg-gray-200 rounded-lg" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-400">Personal Info</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <TextField label="Full Name" value={form.fullName} onChange={(v) => updateField("fullName", v)} required disabled={isLocked} placeholder="Enter your full name" />
              <TextField label="Pronouns" value={form.pronouns} onChange={(v) => updateField("pronouns", v)} disabled={isLocked} placeholder="e.g., she/her, he/him, they/them" />
              <TextField label="Enrolled University" value={form.enrolledUniversity} onChange={(v) => updateField("enrolledUniversity", v)} required disabled={isLocked} placeholder="Enter your university name" />
              <SelectField
                label="Year in School"
                value={form.yearInSchool}
                onChange={(v) => updateField("yearInSchool", v)}
                options={YEAR_IN_SCHOOL_OPTIONS}
                required
                disabled={isLocked}
              />
              <TextField label="State" value={form.state} onChange={(v) => updateField("state", v)} required disabled={isLocked} placeholder="Enter your state" />
              <TextField label="City" value={form.city} onChange={(v) => updateField("city", v)} required disabled={isLocked} placeholder="Enter your city" />
              <TextField label="Major" value={form.major} onChange={(v) => updateField("major", v)} required disabled={isLocked} placeholder="Enter your major" />
              <TextField label="Expected Graduation" value={form.expectedGraduation} onChange={(v) => updateField("expectedGraduation", v)} required disabled={isLocked} placeholder="e.g., June 2029" />
              <div className="space-y-1.5">
                <TextField label="School Email (.edu)" type="email" value={form.email} onChange={(v) => updateField("email", v)} required disabled={isLocked} placeholder="you@university.edu" hint={!isLocked ? "Must end in .edu — must belong to the university above" : undefined} />
                {!isLocked && (checkingEmail || emailCheck) && (
                  <p
                    className={`text-xs ${
                      checkingEmail
                        ? "text-gray-400"
                        : emailCheck?.status === "match"
                          ? "text-green-700"
                          : emailCheck?.status === "mismatch"
                            ? "text-red-600"
                            : "text-gray-400"
                    }`}
                  >
                    {checkingEmail
                      ? "Checking school email…"
                      : emailCheck?.status === "match"
                        ? `✓ Email verified for ${emailCheck.college?.name}`
                        : emailCheck?.status === "mismatch"
                          ? `✗ This email belongs to ${emailCheck.college?.name}, not "${form.enrolledUniversity}"`
                          : "We couldn't match this email domain to a college — an admin will verify it manually."}
                  </p>
                )}
              </div>
              <TextField label="Phone" value={form.phone} onChange={(v) => updateField("phone", v)} required disabled={isLocked} placeholder="Enter your phone number" />
            </div>
            <TextField
              label="Instagram Handle"
              value={form.socialMedia}
              onChange={(v) => updateField("socialMedia", v)}
              disabled={isLocked}
              placeholder="@username"
              hint={!isLocked ? "Optional — your Instagram @handle so we can find and tag you" : undefined}
            />
          </section>

          <div className="border-t-2 border-gray-300" />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-400">
              Career Interests
              <span className="text-red-500 ml-1">*</span>
            </h2>
            <MultiSelectGroup
              options={CAREER_INTEREST_OPTIONS}
              values={form.careerInterests}
              onToggle={(v) => toggleMultiSelect("careerInterests", v)}
              disabled={isLocked}
            />
            {requiresCareerOther && (
              <TextField
                label="Other Career Interest"
                value={form.careerInterestsOther}
                onChange={(v) => updateField("careerInterestsOther", v)}
                disabled={isLocked}
                required
                placeholder="Please specify"
              />
            )}
          </section>

          <div className="border-t-2 border-gray-300" />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-400">AMSA Interests</h2>
            <MultiSelectGroup
              options={AMSA_INTEREST_OPTIONS}
              values={form.amsaInterests}
              onToggle={(v) => toggleMultiSelect("amsaInterests", v)}
              disabled={isLocked}
            />
            {requiresAmsaOther && (
              <TextField
                label="Other AMSA Interest"
                value={form.amsaInterestsOther}
                onChange={(v) => updateField("amsaInterestsOther", v)}
                disabled={isLocked}
                required
                placeholder="Please specify"
              />
            )}
          </section>

          <div className="border-t-2 border-gray-300" />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-400">Additional Questions</h2>
            <SelectField
              label="Mentorship Interest"
              value={form.mentorshipInterest}
              onChange={(v) => updateField("mentorshipInterest", v)}
              options={MENTORSHIP_INTEREST_OPTIONS}
              required
              disabled={isLocked}
            />
            <TextAreaField
              label="Event Ideas"
              value={form.eventIdeas}
              onChange={(v) => updateField("eventIdeas", v)}
              disabled={isLocked}
              placeholder="Share any event ideas you want AMSA to organize"
            />
            <SelectField
              label="How did you hear about AMSA?"
              value={form.heardAboutAmsa}
              onChange={(v) => updateField("heardAboutAmsa", v)}
              options={HEARD_ABOUT_AMSA_OPTIONS}
              required
              disabled={isLocked}
            />
            {requiresHeardOther && (
              <TextField
                label="How did you hear about AMSA? (Other)"
                value={form.heardAboutAmsaOther}
                onChange={(v) => updateField("heardAboutAmsaOther", v)}
                disabled={isLocked}
                required
                placeholder="Please specify"
              />
            )}
          </section>

          <div className="border-t-2 border-gray-300" />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || isLocked}
              className="px-6 py-3 rounded-xl bg-[#001049] text-white text-base font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001049]/20 focus:border-[#001049] bg-white transition disabled:bg-gray-50"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        disabled={disabled}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001049]/20 focus:border-[#001049] bg-white transition resize-none disabled:bg-gray-50"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full px-4 py-3 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001049]/20 focus:border-[#001049] bg-white transition disabled:bg-gray-50"
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function MultiSelectGroup({
  options,
  values,
  onToggle,
  disabled,
}: {
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {options.map((option) => (
        <label
          key={option}
          className="inline-flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-700"
        >
          <input
            type="checkbox"
            checked={values.includes(option)}
            onChange={() => onToggle(option)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-[#001049] focus:ring-[#001049]/30"
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}
