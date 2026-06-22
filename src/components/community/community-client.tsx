"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare, ChevronUp, Search, BadgeCheck, Tag, Trophy,
  HelpCircle, Lightbulb, AlertTriangle, Plus, X, Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { filterPosts, COMMUNITY_POSTS, type PostCategory, type CommunityPost } from "@/lib/mock-community";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const CATEGORIES: { id: PostCategory | "all"; label: string; icon: typeof Trophy; color: string }[] = [
  { id: "all", label: "All posts", icon: Globe2, color: "text-muted-foreground" },
  { id: "success_story", label: "Success stories", icon: Trophy, color: "text-emerald-600" },
  { id: "question", label: "Questions", icon: HelpCircle, color: "text-blue-600" },
  { id: "tip", label: "Tips & advice", icon: Lightbulb, color: "text-amber-600" },
  { id: "warning", label: "Warnings", icon: AlertTriangle, color: "text-red-600" },
];

const CATEGORY_STYLE: Record<PostCategory, { badge: string; icon: typeof Trophy }> = {
  success_story: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Trophy },
  question: { badge: "bg-blue-50 text-blue-700 border-blue-200", icon: HelpCircle },
  tip: { badge: "bg-amber-50 text-amber-700 border-amber-200", icon: Lightbulb },
  warning: { badge: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
};

const CATEGORY_LABEL: Record<PostCategory, string> = {
  success_story: "Success story",
  question: "Question",
  tip: "Tip",
  warning: "Warning",
};

function timeAgoStr(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function CommunityClient() {
  const { toast } = useToast();
  const [category, setCategory] = useState<PostCategory | "all">("all");
  const [q, setQ] = useState("");
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [showNewPost, setShowNewPost] = useState(false);

  const posts = useMemo(() => filterPosts(category, q), [category, q]);

  const handleVote = (id: string, base: number) => {
    setVotes((v) => ({ ...v, [id]: (v[id] !== undefined ? v[id] : base) + 1 }));
    toast("Upvoted!", "success");
  };

  return (
    <div className="container py-10 sm:py-14">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Community</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">Sponsorship stories & advice</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Real experiences from international workers who found UK sponsors. Share what worked — and what didn&apos;t.
        </p>
      </div>

      {/* Stats */}
      <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-4 sm:grid-cols-3">
        {[
          { value: COMMUNITY_POSTS.length, label: "Posts" },
          { value: COMMUNITY_POSTS.filter((p) => p.isVerified).length, label: "Verified sponsors" },
          { value: COMMUNITY_POSTS.reduce((a, p) => a + p.upvotes, 0).toLocaleString(), label: "Upvotes" },
        ].map((s) => (
          <div key={s.label} className="glass p-4 text-center">
            <p className="font-display text-2xl">{s.value}</p>
            <p className="eyebrow mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-4xl">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search posts…"
              className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-red-600/40 focus:shadow-[0_0_0_4px_hsl(0_72%_51%/0.08)]"
            />
          </div>

          <Button variant="gradient" size="sm" onClick={() => setShowNewPost(true)}>
            <Plus className="size-4" /> New post
          </Button>
        </div>

        {/* Category filter */}
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                category === c.id
                  ? "border-red-600/40 bg-red-600/10 text-red-600"
                  : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              )}
            >
              <c.icon className={cn("size-3.5", category === c.id ? "text-red-600" : c.color)} />
              {c.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="mt-6 space-y-4">
          {posts.length === 0 ? (
            <div className="surface-card flex flex-col items-center py-16 text-center">
              <MessageSquare className="size-10 text-muted-foreground/50" />
              <p className="mt-4 font-heading font-semibold">No posts found</p>
              <p className="mt-1 text-sm text-muted-foreground">Be the first to share in this category.</p>
              <Button variant="gradient" size="sm" className="mt-4" onClick={() => setShowNewPost(true)}>
                <Plus className="size-4" /> Share your experience
              </Button>
            </div>
          ) : (
            posts.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                votes={votes[post.id] ?? post.upvotes}
                onVote={() => handleVote(post.id, post.upvotes)}
                style={{ animationDelay: `${i * 40}ms` }}
              />
            ))
          )}
        </div>
      </div>

      {/* New post modal */}
      {showNewPost && (
        <NewPostModal onClose={() => setShowNewPost(false)} onSubmit={() => {
          setShowNewPost(false);
          toast("Post submitted for review. Thank you!", "success");
        }} />
      )}
    </div>
  );
}

function PostCard({
  post, votes, onVote, style,
}: {
  post: CommunityPost;
  votes: number;
  onVote: () => void;
  style?: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const style_ = CATEGORY_STYLE[post.category];
  const CategoryIcon = style_.icon;
  const longContent = post.content.length > 280;

  return (
    <article
      style={style}
      className="group surface-card overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.3)] motion-safe:animate-[fade-up_0.4s_ease-out_both]"
    >
      <div className="p-5">
        <div className="flex gap-4">
          {/* Vote column */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onVote}
              className="group/v grid size-9 place-items-center rounded-lg border border-border transition-colors hover:border-red-600/40 hover:bg-red-600/10 hover:text-red-600"
              aria-label="Upvote"
            >
              <ChevronUp className="size-4 transition-transform group-hover/v:scale-110" />
            </button>
            <span className="font-mono text-xs font-semibold tabular text-muted-foreground">{votes.toLocaleString()}</span>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", style_.badge)}>
                <CategoryIcon className="size-3" />
                {CATEGORY_LABEL[post.category]}
              </span>
              {post.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <BadgeCheck className="size-3.5" /> Verified sponsor
                </span>
              )}
            </div>

            <h2 className="mt-2 font-heading text-base font-semibold leading-snug">{post.title}</h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {expanded || !longContent ? post.content : `${post.content.slice(0, 280)}…`}
            </p>
            {longContent && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 text-xs font-medium text-red-600 hover:underline"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.slice(0, 5).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    <Tag className="size-2.5" /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{post.authorName}</span>
              <span>{post.authorCountry}</span>
              <span>·</span>
              <span>{post.authorRole}</span>
              {post.sponsoredDate && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600">✓ Sponsored {post.sponsoredDate}</span>
                </>
              )}
              <span className="ml-auto">{timeAgoStr(post.createdAt)}</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="size-3" /> {post.replies}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function NewPostModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PostCategory>("question");
  const [content, setContent] = useState("");

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-fade-up rounded-t-3xl border border-border bg-card p-6 sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Share your experience</h2>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-lg hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {(["success_story", "question", "tip", "warning"] as PostCategory[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    category === c
                      ? "border-red-600/40 bg-red-600/10 text-red-600"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How I got sponsored in 6 weeks"
              className="h-10 w-full rounded-xl border border-border bg-surface/60 px-4 text-sm outline-none focus:border-red-600/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Your story</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Share details, timelines, what worked, what didn't…"
              className="w-full resize-none rounded-xl border border-border bg-surface/60 p-4 text-sm outline-none focus:border-red-600/40"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              variant="gradient"
              className="flex-1"
              onClick={onSubmit}
              disabled={!title.trim() || !content.trim()}
            >
              Submit post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
