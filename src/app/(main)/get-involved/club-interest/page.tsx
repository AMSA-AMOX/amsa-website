"use client";

import React, { useState } from "react";
import Link from "next/link";

const CLUB_TYPES = ["Cultural", "Academic", "Professional", "Social", "Sports", "Other"];
const SUPPORT_TYPES = [
  "Fundraising Resources",
  "Event Collaboration",
  "Marketing Support",
  "AMSA Membership Outreach",
  "Educational Resources",
];
const HEAR_ABOUT_OPTIONS = [
  "Social Media",
  "Word of Mouth",
  "AMSA Website",
  "Search Engine",
  "Other",
];

export default function ClubInterestPage() {
  const [form, setForm] = useState({
    // Contact
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    // Club Info
    clubName: "",
    universityName: "",
    clubType: "",
    memberCount: "",
    // Online Presence
    clubWebsite: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    // Fundraising
    supportTypes: [] as string[],
    fundraisingIdea: "",
    fundraisingGoal: "",
    timeline: "",
    fundraisedBefore: "",
    fundraisingExperience: "",
    // AMSA Relationship
    hearAbout: "",
    amsaMembers: "",
    interestedInChapter: "",
    // Misc
    additionalInfo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const toggleSupport = (type: string) => {
    setForm((f) => ({
      ...f,
      supportTypes: f.supportTypes.includes(type)
        ? f.supportTypes.filter((t) => t !== type)
        : [...f.supportTypes, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.supportTypes.length === 0) {
      setError("Please select at least one type of support you're looking for.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries/club-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Submission failed");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#FFFCF3] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center">
          <div className="w-16 h-16 bg-[#001A78]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#001A78" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-['Syne-Bold'] text-2xl text-[#001A78] mb-3">
            Thanks for reaching out!
          </h2>
          <p className="text-gray-600 mb-8">
            We&apos;ve received your club interest form. Our team will review it and get back to you soon.
          </p>
          <Link
            href="/get-involved"
            className="text-[#001A78] font-semibold text-sm hover:underline"
          >
            ← Back to Get Involved
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFCF3] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/get-involved"
          className="text-[#001A78] text-sm font-medium hover:underline flex items-center gap-1 mb-8"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </Link>

        <div className="bg-white shadow-lg rounded-2xl p-8">
          <h1 className="font-['Syne-Bold'] text-3xl text-[#001A78] mb-2">
            Club Interest Form
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Tell us about your club so we can provide the support you need to fundraise and grow.
            Fields marked with <span className="text-red-500">*</span> are required.
          </p>

          {error && (
            <p className="text-red-600 text-sm mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Section 1: Contact Info */}
            <section>
              <h2 className="text-xl font-semibold text-[#001A78] mb-4">
                Contact Info
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input name="firstName" value={form.firstName} onChange={handleChange} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input name="lastName" value={form.lastName} onChange={handleChange} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="input" required />
                </div>
              </div>
            </section>

            {/* Section 2: Club Info */}
            <section>
              <h2 className="text-xl font-semibold text-[#001A78] mb-4">
                Club Info
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Club Name <span className="text-red-500">*</span>
                  </label>
                  <input name="clubName" value={form.clubName} onChange={handleChange} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University / College Name <span className="text-red-500">*</span>
                  </label>
                  <input name="universityName" value={form.universityName} onChange={handleChange} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Club Type <span className="text-red-500">*</span>
                  </label>
                  <select name="clubType" value={form.clubType} onChange={handleChange} className="input" required>
                    <option value="">Select type...</option>
                    {CLUB_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approximate Number of Members <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="memberCount"
                    value={form.memberCount}
                    onChange={handleChange}
                    min="1"
                    className="input"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Online Presence */}
            <section>
              <h2 className="text-xl font-semibold text-[#001A78] mb-4">
                Online Presence
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Club Website</label>
                  <input type="url" name="clubWebsite" value={form.clubWebsite} onChange={handleChange} placeholder="https://" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input name="instagram" value={form.instagram} onChange={handleChange} placeholder="@handle" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input name="facebook" value={form.facebook} onChange={handleChange} placeholder="Profile or page link" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <input name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="Profile or page link" className="input" />
                </div>
              </div>
            </section>

            {/* Section 4: Fundraising Goals */}
            <section>
              <h2 className="text-xl font-semibold text-[#001A78] mb-4">
                Fundraising Goals
              </h2>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What type of support are you looking for? <span className="text-red-500">*</span>
                </label>
                <p className="text-gray-400 text-xs mb-3">Select all that apply.</p>
                <div className="flex flex-wrap gap-3">
                  {SUPPORT_TYPES.map((type) => {
                    const checked = form.supportTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleSupport(type)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors duration-200 ${
                          checked
                            ? "bg-[#001A78] text-white border-[#001A78]"
                            : "bg-white text-gray-700 border-gray-300 hover:border-[#001A78]"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe your fundraising idea or event <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="fundraisingIdea"
                  value={form.fundraisingIdea}
                  onChange={handleChange}
                  rows={4}
                  className="input resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Fundraising Goal (USD)
                  </label>
                  <input
                    type="number"
                    name="fundraisingGoal"
                    value={form.fundraisingGoal}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    min="0"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proposed Timeline or Target Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="timeline"
                    value={form.timeline}
                    onChange={handleChange}
                    placeholder="e.g. Spring 2025, April 2025"
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Have you fundraised before? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  {["Yes", "No"].map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input
                        type="radio"
                        name="fundraisedBefore"
                        value={val}
                        checked={form.fundraisedBefore === val}
                        onChange={handleChange}
                        required
                        className="accent-[#001A78]"
                      />
                      {val}
                    </label>
                  ))}
                </div>
              </div>

              {form.fundraisedBefore === "Yes" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Describe your previous fundraising experience
                  </label>
                  <textarea
                    name="fundraisingExperience"
                    value={form.fundraisingExperience}
                    onChange={handleChange}
                    rows={3}
                    className="input resize-none"
                  />
                </div>
              )}
            </section>

            {/* Section 5: Relationship to AMSA */}
            <section>
              <h2 className="text-xl font-semibold text-[#001A78] mb-4">
                Relationship to AMSA
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How did you hear about AMSA? <span className="text-red-500">*</span>
                  </label>
                  <select name="hearAbout" value={form.hearAbout} onChange={handleChange} className="input" required>
                    <option value="">Select...</option>
                    {HEAR_ABOUT_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do any current AMSA members attend your school? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  {["Yes", "No", "Not Sure"].map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input
                        type="radio"
                        name="amsaMembers"
                        value={val}
                        checked={form.amsaMembers === val}
                        onChange={handleChange}
                        required
                        className="accent-[#001A78]"
                      />
                      {val}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you interested in becoming an official AMSA chapter? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  {["Yes", "No", "Maybe"].map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input
                        type="radio"
                        name="interestedInChapter"
                        value={val}
                        checked={form.interestedInChapter === val}
                        onChange={handleChange}
                        required
                        className="accent-[#001A78]"
                      />
                      {val}
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 6: Additional Info */}
            <section>
              <h2 className="text-xl font-semibold text-[#001A78] mb-4">
                Additional Information
              </h2>
              <textarea
                name="additionalInfo"
                value={form.additionalInfo}
                onChange={handleChange}
                rows={4}
                placeholder="Is there anything else we should know about your club or your goals?"
                className="input resize-none"
              />
            </section>

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#001A78] text-white px-8 py-3 rounded-lg shadow hover:bg-[#073D97] transition disabled:opacity-50 font-semibold"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
