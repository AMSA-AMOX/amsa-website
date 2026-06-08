"use client";

import { useState } from "react";

/**
 * Collapsible question prompts shown under a review textarea.
 * "Need ideas?" acts as a toggle; when expanded, tapping a chip inserts that
 * question into the review. Used chips are marked done to discourage duplicates.
 */
export default function ReviewPromptChips({
  prompts,
  used,
  onPick,
}: {
  prompts: string[];
  used: Set<string>;
  onPick: (prompt: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs font-medium text-[#001049] hover:underline"
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
        Need ideas? Tap a question to add it
      </button>

      {open && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {prompts.map((q) => {
            const isUsed = used.has(q);
            return (
              <button
                key={q}
                type="button"
                onClick={() => onPick(q)}
                disabled={isUsed}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  isUsed
                    ? "border-gray-200 bg-gray-50 text-gray-300 cursor-default"
                    : "border-gray-300 text-gray-600 hover:border-[#001049] hover:text-[#001049]"
                }`}
              >
                {isUsed && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
                {q}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
