"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { PostItem } from "@/components/posts/types";
import { POST_TOPICS } from "@/components/posts/types";

type PostComposerProps = {
  onCreated: (post: PostItem) => void;
  canPost?: boolean;
  cannotPostMessage?: string;
  onClose?: () => void;
};

type UserCollege = {
  id: number;
  name: string;
  logoUrl: string | null;
};

const MAX_BODY = 4000;
const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 6 * 1024 * 1024;

const TOPIC_SET = new Set(POST_TOPICS.map((t) => t.toLowerCase()));

function buildHighlightedHtml(text: string): string {
  return text
    .split(/(#\w+)/g)
    .map((part) => {
      const safe = part.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if (/^#\w+$/.test(part) && TOPIC_SET.has(part.slice(1).toLowerCase())) {
        return `<strong style="font-weight:700">${safe}</strong>`;
      }
      return safe;
    })
    .join("");
}

const EMOJIS = [
  { emoji: "🔥", label: ":fire:" },
  { emoji: "❤️", label: ":heart:" },
  { emoji: "😂", label: ":joy:" },
  { emoji: "😊", label: ":smile:" },
  { emoji: "🎉", label: ":tada:" },
  { emoji: "💪", label: ":muscle:" },
];

export default function PostComposer({
  onCreated,
  canPost = true,
  cannotPostMessage = "You do not have permission to post.",
  onClose,
}: PostComposerProps) {
  const { user, authFetch } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [body, setBody] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userCollege, setUserCollege] = useState<UserCollege | null>(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showHashSuggestions, setShowHashSuggestions] = useState(false);
  const [hashQuery, setHashQuery] = useState("");

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const hashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    authFetch("/api/user/college")
      .then((data) => { if (data?.college) setUserCollege(data.college); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
      if (
        hashRef.current && !hashRef.current.contains(e.target as Node) &&
        bodyRef.current && !bodyRef.current.contains(e.target as Node)
      ) setShowHashSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const found = POST_TOPICS.filter((t) =>
      new RegExp(`#${t}(?=[^\\w]|$)`, "i").test(body)
    );
    setTopics(found.slice(0, 3));
  }, [body]);

  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previewUrls.forEach((u) => URL.revokeObjectURL(u)), [previewUrls]);

  const hashSuggestions = useMemo(() => {
    const q = hashQuery.toLowerCase();
    return q ? POST_TOPICS.filter((t) => t.toLowerCase().startsWith(q)) : POST_TOPICS;
  }, [hashQuery]);

  const highlightedBody = useMemo(() => buildHighlightedHtml(body), [body]);

  const canGoNext = useMemo(() =>
    canPost && body.trim().length > 0 && topics.length > 0 && body.trim().length <= MAX_BODY && files.length <= MAX_IMAGES,
  [body, topics, files.length, canPost]);

  const canSubmit = canGoNext && !submitting;

  const insertEmoji = (emoji: string) => {
    const el = bodyRef.current;
    if (!el) { setBody((p) => p + emoji); setShowEmoji(false); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + emoji + body.slice(end);
    setBody(next);
    setShowEmoji(false);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  };

  const insertHashtag = (topic: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? body.length;
    const textBefore = body.slice(0, pos);
    const match = textBefore.match(/#(\w*)$/);
    let newBody: string;
    let newPos: number;
    if (match) {
      const start = pos - match[0].length;
      newBody = body.slice(0, start) + `#${topic} ` + body.slice(pos);
      newPos = start + topic.length + 2;
    } else {
      newBody = body.slice(0, pos) + `#${topic} ` + body.slice(pos);
      newPos = pos + topic.length + 2;
    }
    setBody(newBody);
    setShowHashSuggestions(false);
    setHashQuery("");
    setTimeout(() => { el.focus(); el.setSelectionRange(newPos, newPos); }, 0);
  };

  const insertHashSign = () => {
    const el = bodyRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? body.length;
    const newBody = body.slice(0, pos) + "#" + body.slice(pos);
    setBody(newBody);
    setShowHashSuggestions(true);
    setHashQuery("");
    setShowEmoji(false);
    setTimeout(() => { el.focus(); el.setSelectionRange(pos + 1, pos + 1); }, 0);
  };

  const onBodyChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    const val = el.value;
    setBody(val);
    const pos = el.selectionStart ?? val.length;
    const textBefore = val.slice(0, pos);
    const match = textBefore.match(/#(\w*)$/);
    if (match) {
      setHashQuery(match[1]);
      setShowHashSuggestions(true);
      setShowEmoji(false);
    } else {
      setShowHashSuggestions(false);
    }
  };

  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    const tooLarge = selected.find((f) => f.size > MAX_FILE_SIZE);
    if (tooLarge) { setError(`"${tooLarge.name}" exceeds 6 MB.`); return; }
    const nonImage = selected.find((f) => !f.type.startsWith("image/"));
    if (nonImage) { setError(`"${nonImage.name}" is not an image.`); return; }
    setError("");
    setFiles((prev) => [...prev, ...selected].slice(0, MAX_IMAGES));
    e.target.value = "";
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const uploadImages = async (): Promise<string[]> => {
    if (!user || files.length === 0) return [];
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "jpg" : "jpg";
      const path = `${user.id}/${Date.now()}-${i}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("post-images").upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
      const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  };

  const submitPost = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const imageUrls = await uploadImages();
      const data = await authFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ body: body.trim(), topics, images: imageUrls, collegeId: selectedCollegeId }),
      });
      onCreated(data.post as PostItem);
      setBody(""); setTopics([]); setFiles([]); setSelectedCollegeId(null); setStep(1);
      onClose?.();
    } catch (e: any) {
      setError(e?.message ?? "Could not create post.");
    } finally {
      setSubmitting(false);
    }
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const Header = (
    <div className="flex items-start gap-3 px-5 pt-5 pb-4">
      <div className="w-12 h-12 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-sm font-bold shrink-0 overflow-hidden">
        {user?.profilePic
          ? <img src={user.profilePic} alt={user.firstName} className="w-full h-full object-cover" />
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span className="text-xs text-gray-400">Everyone</span>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
      {Header}

      {step === 1 ? (
        <>
          {/* Outer div is the positioning context so the dropdown escapes overflow-y-auto */}
          <div className="flex-1 relative min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 space-y-3 py-3">
              {!canPost && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {cannotPostMessage}
                </p>
              )}

              <div className="relative">
                {/* Mirror div — renders same text with matched hashtags bolded */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none text-xl font-light leading-normal whitespace-pre-wrap wrap-break-word overflow-hidden p-0 text-gray-700"
                  dangerouslySetInnerHTML={{ __html: highlightedBody }}
                />
                <textarea
                  ref={bodyRef}
                  placeholder="Share your thoughts..."
                  maxLength={MAX_BODY}
                  value={body}
                  onChange={onBodyChange}
                  disabled={!canPost}
                  className="relative w-full text-xl font-light leading-normal bg-transparent focus:outline-none resize-none p-0 placeholder:text-gray-300 min-h-36 overflow-hidden"
                  style={body ? { WebkitTextFillColor: "transparent", caretColor: "#374151" } : {}}
                />
              </div>

              {files.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                  {files.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="relative rounded-lg overflow-hidden">
                      <img src={previewUrls[idx]} alt={`Image ${idx + 1}`} className="w-full" />
                      <button type="button" onClick={() => removeFile(idx)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs hover:bg-black/75 flex items-center justify-center">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            {/* Hash suggestions — outside overflow-y-auto so it's never clipped */}
            {showHashSuggestions && hashSuggestions.length > 0 && (
              <div ref={hashRef} className="absolute bottom-2 left-5 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 w-52 max-h-52 overflow-y-auto">
                <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Topics</p>
                {hashSuggestions.map((t) => {
                  const alreadyIn = topics.includes(t);
                  const atMax = topics.length >= 3 && !alreadyIn;
                  return (
                    <button
                      key={t}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); if (!atMax) insertHashtag(t); }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition ${atMax ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"}`}
                    >
                      <span className="text-gray-700">#{t}</span>
                      {alreadyIn && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#001049] ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center px-5 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-400 w-16">{body.trim().length}/{MAX_BODY}</span>

            {/* Centered icons */}
            <div className="flex-1 flex items-center justify-center gap-1">
              <label className={`p-2 rounded-lg transition ${canPost ? "hover:bg-gray-100 cursor-pointer text-gray-500 hover:text-gray-700" : "opacity-40 cursor-not-allowed text-gray-400"}`} title={`Add image (${files.length}/${MAX_IMAGES})`}>
                <input type="file" multiple accept="image/*" onChange={onPickFiles} disabled={!canPost} className="hidden" />
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </label>

              <div ref={emojiRef} className="relative">
                <button type="button" onClick={() => { setShowEmoji((v) => !v); setShowHashSuggestions(false); }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                  </svg>
                </button>
                {showEmoji && (
                  <div className="absolute bottom-10 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-44">
                    {EMOJIS.map(({ emoji, label }) => (
                      <button key={label} type="button" onClick={() => insertEmoji(emoji)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-left">
                        <span className="text-xl">{emoji}</span>
                        <span className="text-xs text-gray-500 font-mono">{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={insertHashSign} disabled={!canPost}
                  className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-gray-700 font-bold text-base leading-none disabled:opacity-40">
                  #
                </button>
                <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full pointer-events-none transition-all duration-300 ${
                  topics.length > 0 ? "scale-0 opacity-0" : "scale-100 opacity-100 bg-red-400"
                }`} />
              </div>
            </div>

            <div className="w-16 flex justify-end">
              <button type="button" onClick={() => setStep(2)} disabled={!canGoNext}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-500 enabled:bg-[#001049] enabled:text-white enabled:hover:opacity-90">
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Step 2 — audience */}
          <div className="flex-1 px-6 py-8 flex flex-col gap-6">
            <div>
              <p className="text-base font-semibold text-gray-900">Who is this for?</p>
              <p className="text-sm text-gray-400 mt-0.5">Choose who will find this most useful.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedCollegeId(null)}
                className={`flex flex-col items-center gap-2 px-4 py-5 rounded-lg border-2 text-center transition ${selectedCollegeId === null ? "border-[#001049]" : "border-gray-200 hover:border-gray-300"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${selectedCollegeId === null ? "text-[#001049]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3 12a8.959 8.959 0 0 1 .284-2.253" />
                </svg>
                <span className={`text-sm font-semibold ${selectedCollegeId === null ? "text-[#001049]" : "text-gray-700"}`}>General</span>
                <span className="text-xs text-gray-400">Useful for everyone</span>
              </button>

              {userCollege ? (
                <button
                  type="button"
                  onClick={() => setSelectedCollegeId(userCollege.id)}
                  className={`flex flex-col items-center gap-2 px-4 py-5 rounded-lg border-2 text-center transition ${selectedCollegeId === userCollege.id ? "border-[#001049]" : "border-gray-200 hover:border-gray-300"}`}
                >
                  {userCollege.logoUrl
                    ? <img src={userCollege.logoUrl} alt={userCollege.name} className="w-6 h-6 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    : <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${selectedCollegeId === userCollege.id ? "text-[#001049]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                      </svg>
                  }
                  <span className={`text-sm font-semibold truncate ${selectedCollegeId === userCollege.id ? "text-[#001049]" : "text-gray-700"}`}>{userCollege.name}</span>
                  <span className="text-xs text-gray-400">School-specific</span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 py-5 rounded-lg border-2 border-dashed border-gray-200 opacity-40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">My School</span>
                  <span className="text-xs text-gray-400">No school on profile</span>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => { setStep(1); setError(""); }}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
              ← Back
            </button>
            <button type="button" onClick={submitPost} disabled={!canSubmit}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-500 enabled:bg-[#001049] enabled:text-white enabled:hover:opacity-90">
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
