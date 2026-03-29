"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { PostItem } from "@/components/posts/types";

type PostComposerProps = {
  onCreated: (post: PostItem) => void;
  canPost?: boolean;
  cannotPostMessage?: string;
};

const MAX_TITLE = 180;
const MAX_BODY = 4000;
const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 6 * 1024 * 1024;

export default function PostComposer({
  onCreated,
  canPost = true,
  cannotPostMessage = "You do not have permission to post.",
}: PostComposerProps) {
  const { user, authFetch } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const canSubmit = useMemo(() => {
    return (
      !submitting &&
      canPost &&
      title.trim().length > 0 &&
      body.trim().length > 0 &&
      title.trim().length <= MAX_TITLE &&
      body.trim().length <= MAX_BODY &&
      files.length <= MAX_IMAGES
    );
  }, [title, body, files.length, submitting]);

  const onPickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) return;

    const tooLarge = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (tooLarge) {
      setError(`"${tooLarge.name}" is too large. Max file size is 6 MB.`);
      return;
    }

    const nonImage = selected.find((file) => !file.type.startsWith("image/"));
    if (nonImage) {
      setError(`"${nonImage.name}" is not an image.`);
      return;
    }

    setError("");
    setFiles((prev) => [...prev, ...selected].slice(0, MAX_IMAGES));
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user || files.length === 0) return [];
    const urls: string[] = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "jpg" : "jpg";
      const path = `${user.id}/${Date.now()}-${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, file, { upsert: false, contentType: file.type });

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(path);
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
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          images: imageUrls,
        }),
      });

      onCreated(data.post as PostItem);
      setTitle("");
      setBody("");
      setFiles([]);
    } catch (e: any) {
      setError(e?.message ?? "Could not create post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-lg font-bold text-[#001049]">Create a post</h2>
      <p className="text-xs text-gray-500 mt-1">Share updates with title, text, and images.</p>
      {!canPost && (
        <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {cannotPostMessage}
        </p>
      )}

      <div className="mt-4 space-y-3">
        <input
          type="text"
          placeholder="Post title"
          maxLength={MAX_TITLE}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canPost}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20 focus:border-[#001049]"
        />
        <textarea
          placeholder="What do you want to share?"
          maxLength={MAX_BODY}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          disabled={!canPost}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20 focus:border-[#001049] resize-y"
        />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 ${canPost ? "hover:bg-gray-50 cursor-pointer" : "opacity-60 cursor-not-allowed"}`}>
            <input type="file" multiple accept="image/*" onChange={onPickFiles} disabled={!canPost} className="hidden" />
            Add image(s)
          </label>
          <p className="text-xs text-gray-400">
            {files.length}/{MAX_IMAGES} images
          </p>
        </div>

        {files.length > 0 && (
          <div
            className={`${
              files.length === 1
                ? "grid grid-cols-1"
                : files.length === 2
                ? "grid grid-cols-2"
                : "grid grid-cols-2 md:grid-cols-3"
            } gap-2`}
          >
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="relative rounded-xl border border-gray-100 overflow-hidden bg-gray-50"
              >
                <img
                  src={previewUrls[idx]}
                  alt={`Selected image ${idx + 1}`}
                  className="w-full h-52 md:h-60 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs hover:bg-black/75"
                  aria-label={`Remove image ${idx + 1}`}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Title {title.trim().length}/{MAX_TITLE} · Body {body.trim().length}/{MAX_BODY}
          </p>
          <button
            type="button"
            onClick={submitPost}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-xl bg-[#001049] text-white text-sm font-semibold hover:bg-[#073D97] transition disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </section>
  );
}
