"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PostCard from "@/components/posts/PostCard";
import PostComposer from "@/components/posts/PostComposer";
import type { PostItem } from "@/components/posts/types";
import { useAuth } from "@/context/AuthContext";

const SHOP_ITEMS = [
  { key: "agm_ticket", label: "Ticket to AGM", cost: 20, description: "Priority seat + networking access." },
  { key: "amsa_merch", label: "AMSA Merch", cost: 35, description: "Sticker pack + limited tee." },
  { key: "ig_shoutout", label: "Shoutout on IG", cost: 25, description: "Member spotlight story mention." },
  { key: "ig_post", label: "Post on IG", cost: 40, description: "Dedicated feature post." },
] as const;

export default function FeedPage() {
  const router = useRouter();
  const { user, loading, authFetch } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");
  const [postingMessage, setPostingMessage] = useState("");
  const [appreciating, setAppreciating] = useState<Set<number>>(new Set());
  const [policyOpen, setPolicyOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [tokens, setTokens] = useState(0);
  const [shopMessage, setShopMessage] = useState("");
  const [redeemingKey, setRedeemingKey] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<Set<number>>(new Set());
  const canPost =
    user?.role === "us_member" || user?.role === "admin" || user?.role === "board_member";
  const canSeeTopActions = user?.role !== "member";

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    setError("");
    try {
      const data = await authFetch("/api/posts?limit=40");
      setPosts((data.posts ?? []) as PostItem[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load posts.");
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [authFetch]);

  const loadTokens = useCallback(async () => {
    try {
      const data = await authFetch("/api/user/tokens");
      setTokens(Number(data.tokens ?? 0));
    } catch {
      setTokens(0);
    }
  }, [authFetch]);

  const loadFollowing = useCallback(async () => {
    try {
      const data = await authFetch("/api/user/follows");
      setFollowingIds(new Set((data.followingIds ?? []) as number[]));
    } catch {
      setFollowingIds(new Set());
    }
  }, [authFetch]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadPosts();
    loadTokens();
    loadFollowing();
  }, [user, loading, router, loadPosts, loadTokens, loadFollowing]);

  const onAppreciate = async (postId: number) => {
    if (appreciating.has(postId)) return;
    const current = posts.find((post) => post.id === postId);
    if (!current || current.hasAppreciated) return;

    const nextCount = Math.max(0, current.appreciationCount + 1);

    setAppreciating((prev) => new Set(prev).add(postId));
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, hasAppreciated: true, appreciationCount: nextCount }
          : post
      )
    );

    try {
      const data = await authFetch(`/api/posts/${postId}/helpful`, { method: "POST" });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                hasAppreciated: Boolean(data.hasAppreciated),
                appreciationCount: Number(data.appreciationCount ?? post.appreciationCount),
              }
            : post
        )
      );
      loadTokens();
    } catch {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                hasAppreciated: current.hasAppreciated,
                appreciationCount: current.appreciationCount,
              }
            : post
        )
      );
    } finally {
      setAppreciating((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const onFollow = async (authorId: number) => {
    if (followingInProgress.has(authorId)) return;
    const isFollowing = followingIds.has(authorId);
    setFollowingInProgress((prev) => new Set(prev).add(authorId));
    setFollowingIds((prev) => {
      const next = new Set(prev);
      isFollowing ? next.delete(authorId) : next.add(authorId);
      return next;
    });
    try {
      if (isFollowing) {
        await authFetch(`/api/user/follows/${authorId}`, { method: "DELETE" });
      } else {
        await authFetch("/api/user/follows", {
          method: "POST",
          body: JSON.stringify({ followingId: authorId }),
        });
      }
    } catch {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        isFollowing ? next.add(authorId) : next.delete(authorId);
        return next;
      });
    } finally {
      setFollowingInProgress((prev) => {
        const next = new Set(prev);
        next.delete(authorId);
        return next;
      });
    }
  };

  const onCreated = (post: PostItem) => {
    if (post.reviewStatus === "approved") {
      setPosts((prev) => [post, ...prev]);
      setPostingMessage("Post published.");
      setPostOpen(false);
      return;
    }
    setPostingMessage("Post submitted for approval. It will appear on feed once approved.");
    setPostOpen(false);
  };

  const redeemItem = async (itemKey: string) => {
    setRedeemingKey(itemKey);
    setShopMessage("");
    try {
      const data = await authFetch("/api/shop/redeem", {
        method: "POST",
        body: JSON.stringify({ itemKey }),
      });
      setTokens(Number(data.tokens ?? 0));
      setShopMessage(data.message ?? "Redemption request submitted.");
    } catch (e: any) {
      setShopMessage(e?.message ?? "Could not redeem item.");
    } finally {
      setRedeemingKey(null);
    }
  };

  if (!user) return null;

  return (
    <div className="py-8 px-4 md:px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#001049] mb-1">Feed</h1>
      <p className="text-gray-500 text-sm mb-6">
        Community posts from AMSA members. Appreciate posts to send Tokens of Appreciation.
      </p>

      {canSeeTopActions && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPolicyOpen(true)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Posting Policy
          </button>
          <button
            type="button"
            onClick={() => setPostOpen(true)}
            className="px-3 py-2 rounded-xl bg-[#001049] text-white text-sm font-semibold hover:bg-[#073D97]"
          >
            + Post creation
          </button>
          <button
            type="button"
            onClick={() => {
              setShopMessage("");
              setShopOpen(true);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Shop ({tokens} tokens)
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {postingMessage && (
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {postingMessage}
        </div>
      )}

      <div className="space-y-4">
        {loadingPosts &&
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm p-5 space-y-3 animate-pulse border border-gray-100">
              <div className="h-4 bg-gray-100 rounded w-2/5" />
              <div className="h-5 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-4/5" />
              <div className="h-52 bg-gray-100 rounded-xl" />
            </div>
          ))}

        {!loadingPosts && posts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-base font-semibold text-[#001049]">No posts yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Once creators publish updates, they will appear here.
            </p>
          </div>
        )}

        {!loadingPosts &&
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onAppreciate={onAppreciate}
              appreciating={appreciating.has(post.id)}
              showAuthor
              onFollow={post.author?.id !== user.id ? onFollow : undefined}
              isFollowing={post.author ? followingIds.has(post.author.id) : false}
              followingInProgress={post.author ? followingInProgress.has(post.author.id) : false}
            />
          ))}
      </div>

      {policyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPolicyOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#001049]">Posting Policy</h2>
              <button onClick={() => setPolicyOpen(false)} className="text-gray-400 hover:text-gray-600">
                x
              </button>
            </div>
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
              <li>Only US Members, Board Members, and Admins can submit posts.</li>
              <li>US Member posts require Admin/Board approval before they appear on feed.</li>
              <li>Each user can submit up to 2 post requests per day.</li>
              <li>Keep content professional and relevant to AMSA community values.</li>
            </ul>
          </div>
        </div>
      )}

      {postOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPostOpen(false)} />
          <div className="relative w-full max-w-2xl">
            <PostComposer
              onCreated={onCreated}
              canPost={Boolean(canPost)}
              cannotPostMessage="Only US members, board members, and admins can post."
            />
          </div>
        </div>
      )}

      {shopOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShopOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#001049]">AMSA Shop</h2>
                <p className="text-xs text-gray-500 mt-1">Balance: {tokens} Tokens of Appreciation</p>
              </div>
              <button onClick={() => setShopOpen(false)} className="text-gray-400 hover:text-gray-600">
                x
              </button>
            </div>
            <div className="space-y-3">
              {SHOP_ITEMS.map((item) => (
                <div key={item.key} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#001049]">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Cost: {item.cost} tokens</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => redeemItem(item.key)}
                    disabled={redeemingKey === item.key || tokens < item.cost}
                    className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Redeem
                  </button>
                </div>
              ))}
            </div>
            {shopMessage && <p className="mt-4 text-sm text-gray-700">{shopMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
