"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form.email, form.password);
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/welcome");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white shadow-lg rounded-lg my-10">
      <h2 className="text-3xl font-bold text-center text-[#001A78] mb-6">Admin Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            className="input w-full"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="your@amsa.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            className="input w-full"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-[#001A78] text-white px-6 py-3 rounded-lg shadow hover:bg-[#073D97] transition w-full"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
