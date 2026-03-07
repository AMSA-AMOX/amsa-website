"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type Step = "select" | "form";

const SCHOOL_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

function StateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? US_STATES.filter((s) => s.startsWith(query.toUpperCase()))
    : US_STATES;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (state: string) => {
    setQuery(state);
    onChange(state);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        maxLength={2}
        placeholder="e.g. NY"
        className="input w-full uppercase"
        onChange={(e) => {
          const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
          setQuery(v);
          onChange(v);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        required
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto text-sm">
          {filtered.map((s) => (
            <li
              key={s}
              onMouseDown={() => select(s)}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${s === value ? "font-semibold text-[#001049]" : "text-gray-700"}`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SignupMember = () => {
  const { signup } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("select");
  const [isCollegeStudent, setIsCollegeStudent] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    schoolName: "",
    schoolCity: "",
    schoolState: "",
    major: "",
    schoolYear: "",
    facebook: "",
    instagram: "",
    linkedin: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup({
        eduEmail: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        schoolName: formData.schoolName,
        schoolCity: isCollegeStudent ? formData.schoolCity : undefined,
        schoolState: isCollegeStudent ? formData.schoolState : undefined,
        major: isCollegeStudent ? formData.major : undefined,
        schoolYear: isCollegeStudent ? formData.schoolYear : undefined,
        facebook: formData.facebook || undefined,
        instagram: formData.instagram || undefined,
        linkedin: formData.linkedin || undefined,
        isUsCollegeStudent: isCollegeStudent ?? false,
      });
      router.push("/welcome");
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 0: type selector ─────────────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-[#001049] mb-2">
          Become a Member
        </h2>
        <p className="text-gray-500 text-center mb-12">
          First, tell us a bit about yourself.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={() => { setIsCollegeStudent(true); setStep("form"); }}
            className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200 bg-white hover:border-[#001049] hover:shadow-lg transition-all"
          >
            <div className="text-5xl">🎓</div>
            <div className="text-center">
              <p className="text-lg font-semibold text-[#001049]">College Student</p>
              <p className="text-sm text-gray-500 mt-1">Currently enrolled in a US college or university</p>
            </div>
            <span className="mt-auto text-xs font-medium text-[#001049] border border-[#001049] rounded-full px-3 py-1 group-hover:bg-[#001049] group-hover:text-white transition-colors">
              Select →
            </span>
          </button>

          <button
            onClick={() => { setIsCollegeStudent(false); setStep("form"); }}
            className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200 bg-white hover:border-[#FFCA3A] hover:shadow-lg transition-all"
          >
            <div className="text-5xl">🏫</div>
            <div className="text-center">
              <p className="text-lg font-semibold text-[#001049]">Other</p>
              <p className="text-sm text-gray-500 mt-1">High school student or not currently enrolled</p>
            </div>
            <span className="mt-auto text-xs font-medium text-gray-600 border border-gray-300 rounded-full px-3 py-1 group-hover:bg-[#FFCA3A] group-hover:text-[#001049] group-hover:border-[#FFCA3A] transition-colors">
              Select →
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: form ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto p-8 bg-white shadow-lg rounded-2xl my-10">
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => setStep("select")}
          className="text-gray-400 hover:text-[#001049] transition text-xl"
          aria-label="Go back"
        >
          ←
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#001049]">
            {isCollegeStudent ? "College Student" : "Other"} Registration
          </h2>
          <p className="text-sm text-gray-400">
            {isCollegeStudent ? "US college or university" : "High school / not enrolled"}
          </p>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Account */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Account</h3>
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              className="input w-full"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                onChange={handleChange}
                className="input w-full pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-700 transition select-none"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Name</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm text-gray-600">First Name <span className="text-red-500">*</span></label>
              <input name="firstName" placeholder="First Name" onChange={handleChange} className="input w-full" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Last Name <span className="text-red-500">*</span></label>
              <input name="lastName" placeholder="Last Name" onChange={handleChange} className="input w-full" required />
            </div>
          </div>
        </div>

        {/* School */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {isCollegeStudent ? "College" : "School"}
          </h3>
          <div className="space-y-1">
            <label className="text-sm text-gray-600">
              {isCollegeStudent ? "University / College Name" : "School Name"} <span className="text-red-500">*</span>
            </label>
            <input
              name="schoolName"
              placeholder={isCollegeStudent ? "University / College Name" : "School Name"}
              onChange={handleChange}
              className="input w-full"
              required
            />
          </div>
          {isCollegeStudent && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">City <span className="text-red-500">*</span></label>
                  <input name="schoolCity" placeholder="City" onChange={handleChange} className="input w-full" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">State <span className="text-red-500">*</span></label>
                  <StateSelect
                    value={formData.schoolState}
                    onChange={(v) => setFormData((f) => ({ ...f, schoolState: v }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Major <span className="text-red-500">*</span></label>
                <input name="major" placeholder="Major" onChange={handleChange} className="input w-full" required />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Year in School <span className="text-red-500">*</span></label>
                <select
                  name="schoolYear"
                  onChange={handleChange}
                  className="input w-full"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>Select year</option>
                  {SCHOOL_YEARS.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Social (optional) */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Social <span className="normal-case font-normal text-gray-300">(optional)</span>
          </h3>
          <input name="facebook" placeholder="Facebook" onChange={handleChange} className="input w-full" />
          <input name="instagram" placeholder="Instagram" onChange={handleChange} className="input w-full" />
          <input name="linkedin" placeholder="LinkedIn" onChange={handleChange} className="input w-full" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#001A78] text-white py-3 rounded-lg shadow hover:bg-[#073D97] transition disabled:opacity-50 font-medium"
        >
          {loading ? "Registering..." : "Create Account"}
        </button>
      </form>
    </div>
  );
};

export default SignupMember;
