"use client";

import React, { useState } from "react";
import Link from "next/link";

const PARTNERSHIP_TYPES = [
  "Corporate",
  "Community",
  "Academic",
  "Philanthropic",
  "Marketing",
];

export default function PartnerPage() {
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    orgName: "",
    orgWebsite: "",
    partnershipTypes: [] as string[],
    description: "",
    additionalInfo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const toggleType = (type: string) => {
    setForm((f) => ({
      ...f,
      partnershipTypes: f.partnershipTypes.includes(type)
        ? f.partnershipTypes.filter((t) => t !== type)
        : [...f.partnershipTypes, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.partnershipTypes.length === 0) {
      setError("Please select at least one partnership type.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/inquiries/partner", {
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
            Thank you!
          </h2>
          <p className="text-gray-600 mb-8">
            We&apos;ve received your partnership inquiry and will be in touch soon.
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
            Partnership Interest Form
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Fields marked with <span className="text-red-500">*</span> are required.
          </p>

          {error && (
            <p className="text-red-600 text-sm mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            {/* Name */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Org Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization&apos;s Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="orgName"
                  value={form.orgName}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization&apos;s Website <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="orgWebsite"
                  value={form.orgWebsite}
                  onChange={handleChange}
                  placeholder="https://"
                  className="input"
                  required
                />
              </div>
            </div>

            {/* Partnership Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partnership Type <span className="text-red-500">*</span>
              </label>
              <p className="text-gray-400 text-xs mb-3">
                What type of partnership are you interested in? Select all that apply.
              </p>
              <div className="flex flex-wrap gap-3">
                {PARTNERSHIP_TYPES.map((type) => {
                  const checked = form.partnershipTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partnership Description <span className="text-red-500">*</span>
              </label>
              <p className="text-gray-400 text-xs mb-2">
                Please provide your role, company background and goals for the partnership.
              </p>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                className="input resize-none"
                required
              />
            </div>

            {/* Additional Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Information
              </label>
              <p className="text-gray-400 text-xs mb-2">
                Is there anything else we should know?
              </p>
              <textarea
                name="additionalInfo"
                value={form.additionalInfo}
                onChange={handleChange}
                rows={4}
                className="input resize-none"
              />
            </div>

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
