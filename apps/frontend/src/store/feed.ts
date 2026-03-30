'use client';

import { create } from 'zustand';
import type {
  FeedComment,
  FeedDataset,
  FeedID,
  FeedPost,
  FeedReactionSummary,
  FeedReactionType,
  FeedUser,
} from '@smart/types/feed';

type Entities<T extends { id: FeedID }> = Record<FeedID, T>;

const emptyReactions: FeedReactionSummary = {
  like: 0,
  love: 0,
  haha: 0,
  wow: 0,
  sad: 0,
  angry: 0,
};

function safeDec(n: number) {
  return Math.max(0, n - 1);
}

interface FeedState {
  currentUserId: FeedID | null;
  isBootstrapped: boolean;
  isLoading: boolean;
  error: string | null;

  users: Entities<FeedUser>;
  posts: Entities<FeedPost>;
  comments: Entities<FeedComment>;

  postIds: FeedID[];
  commentsByPostId: Record<FeedID, FeedID[]>;
  draftText: string;
  draftImages: string[];

  bootstrap: (dataset: FeedDataset) => void;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;

  createPost: (input: { content: string; media?: FeedPost['media'] }) => void;
  toggleReaction: (postId: FeedID, reaction: FeedReactionType) => void;
  sharePost: (postId: FeedID) => void;
  toggleBookmark: (postId: FeedID) => void;

  addComment: (postId: FeedID, content: string) => void;
  toggleCommentLike: (commentId: FeedID) => void;
  setDraftText: (text: string) => void;
  addDraftImages: (images: string[]) => void;
  removeDraftImage: (index: number) => void;
  clearDraft: () => void;
  publishDraft: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  currentUserId: null,
  isBootstrapped: false,
  isLoading: false,
  error: null,

  users: {},
  posts: {},
  comments: {},

  postIds: [],
  commentsByPostId: {},
  draftText: '',
  draftImages: [],

  bootstrap: (dataset) => {
    const users: Entities<FeedUser> = {};
    const posts: Entities<FeedPost> = {};
    const comments: Entities<FeedComment> = {};
    const postIds: FeedID[] = [];
    const commentsByPostId: Record<FeedID, FeedID[]> = {};

    dataset.users.forEach((u) => (users[u.id] = u));

    dataset.posts.forEach((p) => {
      posts[p.id] = {
        ...p,
        reactionSummary: { ...emptyReactions, ...(p.reactionSummary || {}) },
        media: p.media || [],
        myReaction: p.myReaction ?? null,
        bookmarkedByMe: Boolean(p.bookmarkedByMe),
      };
      postIds.push(p.id);
    });

    dataset.comments.forEach((c) => {
      comments[c.id] = { ...c, likedByMe: Boolean(c.likedByMe) };
      commentsByPostId[c.postId] = commentsByPostId[c.postId] || [];
      commentsByPostId[c.postId].push(c.id);
    });

    postIds.sort((a, b) => {
      const pa = posts[a];
      const pb = posts[b];
      return new Date(pb?.createdAt || 0).getTime() - new Date(pa?.createdAt || 0).getTime();
    });

    Object.keys(commentsByPostId).forEach((pid) => {
      commentsByPostId[pid].sort((a, b) => {
        const ca = comments[a];
        const cb = comments[b];
        return new Date(ca?.createdAt || 0).getTime() - new Date(cb?.createdAt || 0).getTime();
      });
    });

    set({
      currentUserId: dataset.currentUserId,
      users,
      posts,
      comments,
      postIds,
      commentsByPostId,
      isBootstrapped: true,
      error: null,
    });
  },

  setLoading: (value) => set({ isLoading: value }),
  setError: (value) => set({ error: value }),

  createPost: ({ content, media }) =>
    set((s) => {
      if (!s.currentUserId) return s;
      const id = `p_${Date.now()}`;
      const now = new Date().toISOString();
      const post: FeedPost = {
        id,
        authorId: s.currentUserId,
        createdAt: now,
        content,
        media: media || [],
        reactionSummary: { ...emptyReactions },
        commentCount: 0,
        shareCount: 0,
        myReaction: null,
        bookmarkedByMe: false,
      };
      return {
        posts: { ...s.posts, [id]: post },
        postIds: [id, ...s.postIds],
      };
    }),

  toggleReaction: (postId, reaction) =>
    set((s) => {
      const post = s.posts[postId];
      if (!post) return s;

      const prev = post.myReaction ?? null;
      const next = prev === reaction ? null : reaction;

      const summary: FeedReactionSummary = { ...emptyReactions, ...post.reactionSummary };

      if (prev) {
        summary[prev] = safeDec(summary[prev] || 0);
      }
      if (next) {
        summary[next] = (summary[next] || 0) + 1;
      }

      return {
        posts: {
          ...s.posts,
          [postId]: {
            ...post,
            myReaction: next,
            reactionSummary: summary,
          },
        },
      };
    }),

  sharePost: (postId) =>
    set((s) => {
      const post = s.posts[postId];
      if (!post) return s;
      return {
        posts: { ...s.posts, [postId]: { ...post, shareCount: (post.shareCount || 0) + 1 } },
      };
    }),

  toggleBookmark: (postId) =>
    set((s) => {
      const post = s.posts[postId];
      if (!post) return s;
      return {
        posts: {
          ...s.posts,
          [postId]: { ...post, bookmarkedByMe: !Boolean(post.bookmarkedByMe) },
        },
      };
    }),

  addComment: (postId, content) =>
    set((s) => {
      if (!s.currentUserId) return s;
      const post = s.posts[postId];
      if (!post) return s;

      const id = `c_${Date.now()}`;
      const now = new Date().toISOString();
      const comment: FeedComment = {
        id,
        postId,
        authorId: s.currentUserId,
        content,
        createdAt: now,
        likeCount: 0,
        likedByMe: false,
      };

      const list = [...(s.commentsByPostId[postId] || []), id];

      return {
        comments: { ...s.comments, [id]: comment },
        commentsByPostId: { ...s.commentsByPostId, [postId]: list },
        posts: {
          ...s.posts,
          [postId]: { ...post, commentCount: (post.commentCount || 0) + 1 },
        },
      };
    }),

  toggleCommentLike: (commentId) =>
    set((s) => {
      const c = s.comments[commentId];
      if (!c) return s;
      const liked = !Boolean(c.likedByMe);
      return {
        comments: {
          ...s.comments,
          [commentId]: {
            ...c,
            likedByMe: liked,
            likeCount: liked ? (c.likeCount || 0) + 1 : safeDec(c.likeCount || 0),
          },
        },
      };
    }),

  setDraftText: (text) => set({ draftText: text }),
  addDraftImages: (images) =>
    set((s) => ({ draftImages: [...s.draftImages, ...images].slice(0, 6) })),
  removeDraftImage: (index) =>
    set((s) => ({
      draftImages: s.draftImages.filter((_, i) => i !== index),
    })),
  clearDraft: () => set({ draftText: '', draftImages: [] }),
  publishDraft: () => {
    const s = get();
    const content = s.draftText.trim();
    const media = s.draftImages.map((url, i) => ({
      id: `m_${Date.now()}_${i}`,
      type: 'image' as const,
      url,
      alt: `upload-${i + 1}`,
    }));

    if (!content && !media.length) return;
    s.createPost({ content: content || 'Ảnh mới', media });
    s.clearDraft();
  },
}));

