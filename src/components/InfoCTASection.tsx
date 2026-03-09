"use client";

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faEnvelope, faBell } from "@fortawesome/free-solid-svg-icons";
import AOS from "aos";
import "aos/dist/aos.css";
import { supabase } from "@/lib/supabase";

const staticCtas = [
  { icon: faUserPlus, label: "Become a member", action: "Register to AMSA!", link: "/signup/member" },
  { icon: faEnvelope, label: "Wanna contribute?", action: "Contact us", link: "mailto:administration@amsa.mn" },
];

const InfoCTASection = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    const { data: existing } = await supabase
      .from("newsletter")
      .select("email")
      .eq("email", form.email)
      .maybeSingle();

    if (existing) {
      setErrorMsg("This email is already subscribed.");
      setStatus("error");
      return;
    }

    const { error } = await supabase.from("newsletter").insert([
      { first_name: form.firstName, last_name: form.lastName, email: form.email },
    ]);
    if (error) {
      console.error("Newsletter insert error:", error);
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("success");
      setForm({ firstName: "", lastName: "", email: "" });
    }
  };

  return (
    <section className="py-16 px-6 max-w-4xl mx-auto text-center font-poppins" data-aos="fade-up">
      <h2 className="text-3xl md:text-4xl mb-10 font-['Syne-Bold'] font-bold text-[#001A78]">
        Are you a{" "}
        <span className="bg-[#e3e9f4] text-[#001A78] px-2 py-1 rounded-[10px] font-poppins font-semibold">
          Mongolian
        </span>{" "}
        student in{" "}
        <span className="bg-[#e3e9f4] text-[#001A78] px-2 py-1 rounded-[10px] font-poppins font-semibold">
          US
        </span>
        ?
      </h2>

      <div className="flex flex-col gap-6">
        {staticCtas.map((item, index) => (
          <a
            href={item.link}
            key={index}
            data-aos="zoom-in"
            data-aos-delay={String(index * 100)}
            className="flex justify-between items-center px-6 py-4 border-b border-gray-300 text-[#171414] hover:bg-[#f9f9f9] transition-all transform hover:scale-[1.02] no-underline"
          >
            <div className="flex items-center gap-3 text-[#001A78] text-lg font-medium">
              <FontAwesomeIcon icon={item.icon} className="text-xl" />
              {item.label}
            </div>
            <div className="text-[#001A78] font-bold">{item.action} →</div>
          </a>
        ))}

        {/* Newsletter row */}
        <div data-aos="zoom-in" data-aos-delay="200">
          <button
            onClick={() => { setOpen(!open); setStatus("idle"); }}
            className="w-full flex justify-between items-center px-6 py-4 border-b border-gray-300 text-[#171414] hover:bg-[#f9f9f9] transition-all transform hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 text-[#001A78] text-lg font-medium">
              <FontAwesomeIcon icon={faBell} className="text-xl" />
              Stay in the loop
            </div>
            <div className="text-[#001A78] font-bold">Subscribe to newsletter {open ? "↑" : "→"}</div>
          </button>

          {/* Inline form */}
          {open && (
            <div className="mt-3 px-6 pb-4 text-left">
              {status === "success" ? (
                <p className="text-green-600 font-medium py-4 text-center">
                  You&apos;re subscribed! Thanks for joining.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-gray-500 font-medium">First name</label>
                    <input
                      required
                      value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      placeholder="First"
                      className="input"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-gray-500 font-medium">Last name</label>
                    <input
                      required
                      value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      placeholder="Last"
                      className="input"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-gray-500 font-medium">Email</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="bg-[#001A78] text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-[#FFCA3A] hover:text-[#001A78] transition-all duration-300 disabled:opacity-50 whitespace-nowrap"
                  >
                    {status === "loading" ? "Subscribing…" : "Subscribe"}
                  </button>
                  </div>
                  {status === "error" && (
                    <p className="text-red-500 text-xs">{errorMsg || "Something went wrong. Try again."}</p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default InfoCTASection;
