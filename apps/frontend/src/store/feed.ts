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
import { autoRequest } from '../services/auto.request';

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

export interface DraftImage {
  preview: string;
  file: File;
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
  draftImages: DraftImage[];

  bootstrap: (dataset: FeedDataset) => void;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;

  createPost: (input: { content: string; media?: FeedPost['media'] }) => Promise<void>;
  toggleReaction: (postId: FeedID, reaction: FeedReactionType) => Promise<void>;
  sharePost: (postId: FeedID) => void;
  toggleBookmark: (postId: FeedID) => void;

  addComment: (postId: FeedID, content: string) => Promise<void>;
  toggleCommentLike: (commentId: FeedID) => void;
  followUser: (targetId: FeedID) => Promise<void>;
  unfollowUser: (targetId: FeedID) => Promise<void>;
  setDraftText: (text: string) => void;
  addDraftImages: (images: DraftImage[]) => void;
  removeDraftImage: (index: number) => void;
  clearDraft: () => void;
  publishDraft: () => Promise<void>;
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

  createPost: async ({ content, media }) => {
    try {
      const res = await autoRequest<FeedPost>('/home/post', {
        method: 'POST',
        body: JSON.stringify({ content, media }),
      });
      
      set((s) => ({
        posts: {
          ...s.posts,
          [res.id]: {
            ...res,
            reactionSummary: { ...emptyReactions },
            commentCount: 0,
            shareCount: 0,
            media: res.media || [],
            myReaction: null,
            bookmarkedByMe: false,
          },
        },
        postIds: [res.id, ...s.postIds],
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  toggleReaction: async (postId, reaction) => {
    // Optimistic update
    set((s) => {
      const post = s.posts[postId];
      if (!post) return s;

      const prev = post.myReaction ?? null;
      const next = prev === reaction ? null : reaction;
      const summary: FeedReactionSummary = { ...emptyReactions, ...post.reactionSummary };

      if (prev) summary[prev] = safeDec(summary[prev] || 0);
      if (next) summary[next] = (summary[next] || 0) + 1;

      return {
        posts: {
          ...s.posts,
          [postId]: { ...post, myReaction: next, reactionSummary: summary },
        },
      };
    });

    try {
      await autoRequest(`/home/post/${postId}/like`, {
        method: 'POST',
        body: JSON.stringify({ type: reaction.toUpperCase() }),
      });
    } catch (err: any) {
      set({ error: err.message });
      // Rollback logic could be added here
    }
  },

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

  addComment: async (postId, content) => {
    try {
      const res = await autoRequest<FeedComment>(`/home/post/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });

      set((s) => {
        const post = s.posts[postId];
        const list = [...(s.commentsByPostId[postId] || []), res.id];
        return {
          comments: {
            ...s.comments,
            [res.id]: {
              ...res,
              likeCount: 0,
              likedByMe: false,
            },
          },
          commentsByPostId: { ...s.commentsByPostId, [postId]: list },
          posts: {
            ...s.posts,
            [postId]: { ...post!, commentCount: (post!.commentCount || 0) + 1 },
          },
        };
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

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

  followUser: async (targetId: FeedID) => {
    try {
      await autoRequest(`/home/user/${targetId}/follow`, { method: 'POST' });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  unfollowUser: async (targetId: FeedID) => {
    try {
      await autoRequest(`/home/user/${targetId}/unfollow`, { method: 'POST' });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setDraftText: (text) => set({ draftText: text }),
  addDraftImages: (images) =>
    set((s) => ({ draftImages: [...s.draftImages, ...images].slice(0, 6) })),
  removeDraftImage: (index) =>
    set((s) => ({
      draftImages: s.draftImages.filter((_, i) => i !== index),
    })),
  clearDraft: () => set({ draftText: '', draftImages: [] }),
  
  publishDraft: async () => {
    const s = get();
    const content = s.draftText.trim();
    const draftImages = s.draftImages;

    if (!content && !draftImages.length) return;

    set({ isLoading: true });
    try {
      let mediaUrls: FeedPost['media'] = [];

      // 1. Upload images if any
      if (draftImages.length > 0) {
        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('projectFolder', 'home_feed');
        draftImages.forEach((img) => formData.append('files', img.file));

        const uploadRes = await autoRequest<{ success: boolean; data: any[] }>('/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.success) {
          mediaUrls = uploadRes.data.map((r, i) => ({
            id: `m_${Date.now()}_${i}`,
            type: 'image' as const,
            url: r.url,
            alt: `upload-${i + 1}`,
          }));
        }
      }

      // 2. Create post
      await s.createPost({ content: content || 'Ảnh mới', media: mediaUrls });
      s.clearDraft();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
