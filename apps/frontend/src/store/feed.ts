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
import { API_ENDPOINTS } from '@smart/lib/constants';

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
  activePostId: FeedID | null;
  setActivePostId: (postId: FeedID | null) => void;
  error: string | null;

  users: Entities<FeedUser>;
  posts: Entities<FeedPost>;
  comments: Entities<FeedComment>;

  postIds: FeedID[];
  readPostIds: FeedID[];
  hasMore: boolean;
  page: number;
  commentsByPostId: Record<FeedID, FeedID[]>;
  draftTitle: string;
  draftText: string;
  draftLinkUrl: string;
  draftImages: DraftImage[];
  draftVisibility: 'public' | 'friends' | 'private';
  draftMood: string | null;
  draftBackgroundStyle: string | null;

  bootstrap: (dataset: FeedDataset) => void;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;

  createPost: (input: { 
    title?: string; 
    content: string; 
    linkUrl?: string; 
    media?: FeedPost['media'];
    visibility?: FeedPost['visibility'];
    mood?: FeedPost['mood'];
    backgroundStyle?: FeedPost['backgroundStyle'];
  }) => Promise<void>;
  toggleReaction: (postId: FeedID, reaction: FeedReactionType) => Promise<void>;
  sharePost: (postId: FeedID) => void;
  toggleBookmark: (postId: FeedID) => void;

  addComment: (postId: FeedID, content: string) => Promise<void>;
  toggleCommentLike: (commentId: FeedID) => void;
  followUser: (targetId: FeedID) => Promise<void>;
  unfollowUser: (targetId: FeedID) => Promise<void>;
  setDraftTitle: (title: string) => void;
  setDraftText: (text: string) => void;
  setDraftLinkUrl: (url: string) => void;
  addDraftImages: (images: DraftImage[]) => void;
  removeDraftImage: (index: number) => void;
  setDraftVisibility: (v: 'public' | 'friends' | 'private') => void;
  setDraftMood: (m: string | null) => void;
  setDraftBackgroundStyle: (s: string | null) => void;
  clearDraft: () => void;
  publishDraft: () => Promise<void>;
  fetchPostDetails: (postId: FeedID) => Promise<void>;
  fetchComments: (postId: FeedID) => Promise<void>;
  refreshPostData: (postId: FeedID) => Promise<void>;
  reloadFeed: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  updateUserMood: (mood: string | null) => Promise<void>;
  updateProfile: (data: Partial<FeedUser>) => Promise<void>;
  fetchUser: (userId: string) => Promise<void>;
  fetchUserProfileData: (targetUserId: string) => Promise<{ followersCount: number; followingCount: number; isFollowing: boolean }>;
  fetchUserMedia: (targetUserId: string) => Promise<any[]>;
}

const feedFetchPromises = new Map<string, Promise<any>>();

export const useFeedStore = create<FeedState>((set, get) => ({
  currentUserId: null,
  isBootstrapped: false,
  activePostId: null,
  setActivePostId: (postId) => set({ activePostId: postId }),
  isLoading: false,
  error: null,

  users: {},
  posts: {},
  comments: {},

  postIds: [],
  readPostIds: [],
  hasMore: true,
  page: 0,
  commentsByPostId: {},
  draftTitle: '',
  draftText: '',
  draftLinkUrl: '',
  draftImages: [],
  draftVisibility: 'public',
  draftMood: null,
  draftBackgroundStyle: null,

  bootstrap: (dataset: FeedDataset) => {
    console.log('[FeedStore] Bootstrapping with dataset:', dataset);
    const users: Record<FeedID, FeedUser> = { ...get().users };
    const posts: Entities<FeedPost> = {};
    const comments: Entities<FeedComment> = {};
    const postIds: FeedID[] = [];
    const commentsByPostId: Record<FeedID, FeedID[]> = {};

    if (!dataset) {
      console.error('[FeedStore] Bootstrap failed: dataset is null/undefined');
      return;
    }

    if (!dataset.users || !dataset.posts) {
      console.error('[FeedStore] Bootstrap failed: users or posts missing from dataset', dataset);
    }

    dataset.users.forEach((u) => {
      const normalizedUser = {
        ...u,
        avatarUrl: u.avatarUrl || u.avatar,
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        username: u.username || u.email.split('@')[0],
      };
      users[u.id] = normalizedUser;
    });

    dataset.posts.forEach((p) => {
      posts[p.id] = {
        ...p,
        visibility: (p.visibility || 'public').toLowerCase() as any,
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
      readPostIds: [...postIds],
      commentsByPostId,
      isBootstrapped: true,
      error: null,
      page: 0,
      hasMore: dataset.posts.length > 0,
    });
  },

  setLoading: (value) => set({ isLoading: value }),
  setError: (value) => set({ error: value }),

  createPost: async ({ title, content, linkUrl, media, visibility, mood, backgroundStyle }) => {
    try {
      const response = await autoRequest<{ success: boolean; data: FeedPost }>('/home/post', {
        method: 'POST',
        body: JSON.stringify({ title, content, linkUrl, media, visibility, mood, backgroundStyle }),
      });
      const res = response.data;
      
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
    const previousPosts = get().posts;
    const post = previousPosts[postId];
    if (!post) return;

    // Snapshot for rollback
    const previousPostState = { ...post };

    // Optimistic update
    set((s) => {
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
      // Rollback on failure
      set((s) => ({
        posts: { ...s.posts, [postId]: previousPostState },
        error: `Không thể cập nhật cảm xúc: ${err.message}`
      }));
    }
  },

  sharePost: (postId) => {
    // Optimistic UI update
    set((s) => {
      const post = s.posts[postId];
      if (!post) return s;
      return {
        posts: { ...s.posts, [postId]: { ...post, shareCount: (post.shareCount || 0) + 1 } },
      };
    });
    // Fire-and-forget request to backend
    (async () => {
      try {
        await autoRequest(`/home/post/${postId}/share`, { method: 'POST' });
      } catch (err: any) {
        set({ error: err.message });
      }
    })();
  },

  toggleBookmark: async (postId) => {
    const previousPosts = get().posts;
    const post = previousPosts[postId];
    if (!post) return;

    const previousState = { ...post };

    set((s) => ({
      posts: {
        ...s.posts,
        [postId]: { ...post, bookmarkedByMe: !post.bookmarkedByMe },
      },
    }));

    try {
      // In a real app, this would be an API call
      // await autoRequest(`/home/post/${postId}/bookmark`, { method: 'POST' });
    } catch (err: any) {
      set((s) => ({
        posts: { ...s.posts, [postId]: previousState },
        error: `Không thể lưu bài viết: ${err.message}`
      }));
    }
  },

  addComment: async (postId, content) => {
    try {
      const response = await autoRequest<{ success: boolean; data: FeedComment }>(`/home/post/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      const res = response.data;

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

  toggleCommentLike: async (commentId) => {
    const previousComments = get().comments;
    const c = previousComments[commentId];
    if (!c) return;

    const previousState = { ...c };
    const liked = !c.likedByMe;

    set((s) => ({
      comments: {
        ...s.comments,
        [commentId]: {
          ...c,
          likedByMe: liked,
          likeCount: liked ? (c.likeCount || 0) + 1 : safeDec(c.likeCount || 0),
        },
      },
    }));

    try {
      // In a real app, this would be an API call
      // await autoRequest(`/home/comment/${commentId}/like`, { method: 'POST' });
    } catch (err: any) {
      set((s) => ({
        comments: { ...s.comments, [commentId]: previousState },
        error: `Không thể thích bình luận: ${err.message}`
      }));
    }
  },

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

  setDraftTitle: (title) => set({ draftTitle: title }),
  setDraftText: (text) => set({ draftText: text }),
  setDraftLinkUrl: (url) => set({ draftLinkUrl: url }),
  addDraftImages: (images) =>
    set((s) => ({ draftImages: [...s.draftImages, ...images].slice(0, 6) })),
  removeDraftImage: (index) =>
    set((s) => ({
      draftImages: s.draftImages.filter((_, i) => i !== index),
    })),
  clearDraft: () => set({ draftTitle: '', draftText: '', draftLinkUrl: '', draftImages: [], draftMood: null, draftBackgroundStyle: null, draftVisibility: 'public' }),
  
  setDraftVisibility: (v: 'public' | 'friends' | 'private') => set({ draftVisibility: v }),
  setDraftMood: (m: string | null) => set({ draftMood: m }),
  setDraftBackgroundStyle: (s: string | null) => set({ draftBackgroundStyle: s }),
  
  publishDraft: async () => {
    const s = get();
    const title = s.draftTitle.trim();
    const content = s.draftText.trim();
    const linkUrl = s.draftLinkUrl.trim();
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
      await s.createPost({ 
        title: title || undefined, 
        content: content || 'Ảnh mới', 
        linkUrl: linkUrl || undefined, 
        media: mediaUrls,
        visibility: s.draftVisibility,
        mood: s.draftMood,
        backgroundStyle: s.draftBackgroundStyle
      });
      s.clearDraft();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPostDetails: async (postId) => {
    const key = `post:${postId}`;
    if (feedFetchPromises.has(key)) return feedFetchPromises.get(key);

    const promise = (async () => {
      try {
        const response = await autoRequest<{ success: boolean; data: FeedPost }>(`/home/post/${postId}`);
        const res = response.data;
        set((s) => ({
          posts: {
            ...s.posts,
            [res.id]: {
              ...res,
              reactionSummary: { ...emptyReactions, ...(res.reactionSummary || {}) },
              media: res.media || [],
              myReaction: res.myReaction ?? null,
              bookmarkedByMe: Boolean(res.bookmarkedByMe),
            },
          },
        }));
      } catch (err: any) {
        set({ error: err.message });
      } finally {
        feedFetchPromises.delete(key);
      }
    })();

    feedFetchPromises.set(key, promise);
    return promise;
  },

  fetchComments: async (postId) => {
    const key = `comments:${postId}`;
    if (feedFetchPromises.has(key)) return feedFetchPromises.get(key);

    const promise = (async () => {
      try {
        const response = await autoRequest<{ success: boolean; data: FeedComment[] }>(`/home/post/${postId}/comments`);
        const res = response.data;
        set((s) => {
          const newComments = { ...s.comments };
          const commentIds: FeedID[] = [];

          res.forEach((c) => {
            newComments[c.id] = { ...c, likedByMe: Boolean(c.likedByMe) };
            commentIds.push(c.id);
          });

          commentIds.sort((a, b) => {
            const ca = newComments[a];
            const cb = newComments[b];
            return new Date(ca?.createdAt || 0).getTime() - new Date(cb?.createdAt || 0).getTime();
          });

          return {
            comments: newComments,
            commentsByPostId: {
              ...s.commentsByPostId,
              [postId]: commentIds,
            },
          };
        });
      } catch (err: any) {
        set({ error: err.message });
      } finally {
        feedFetchPromises.delete(key);
      }
    })();

    feedFetchPromises.set(key, promise);
    return promise;
  },

  refreshPostData: async (postId) => {
    try {
      const response = await autoRequest<{ success: boolean; data: FeedDataset }>('/home/feed', { method: 'GET' });
      const data = response.data;
      const targetPost = data.posts.find((p) => p.id === postId);
      if (!targetPost) return;

      const relatedComments = data.comments.filter((c) => c.postId === postId);

      set((s) => {
        const users = { ...s.users };
        data.users.forEach((u) => {
          users[u.id] = u;
        });

        const comments = { ...s.comments };
        const commentIds: FeedID[] = [];
        relatedComments.forEach((c) => {
          comments[c.id] = { ...c, likedByMe: Boolean(c.likedByMe) };
          commentIds.push(c.id);
        });

        commentIds.sort((a, b) => {
          const ca = comments[a];
          const cb = comments[b];
          return new Date(ca?.createdAt || 0).getTime() - new Date(cb?.createdAt || 0).getTime();
        });

        return {
          users,
          posts: {
            ...s.posts,
            [targetPost.id]: {
              ...targetPost,
              reactionSummary: { ...emptyReactions, ...(targetPost.reactionSummary || {}) },
              media: targetPost.media || [],
              myReaction: targetPost.myReaction ?? null,
              bookmarkedByMe: Boolean(targetPost.bookmarkedByMe),
            },
          },
          comments,
          commentsByPostId: {
            ...s.commentsByPostId,
            [postId]: commentIds,
          },
        };
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  reloadFeed: async () => {
    set({ isLoading: true, postIds: [], readPostIds: [], page: 0, hasMore: true });
    try {
      const response = await autoRequest<{ success: boolean; data: FeedDataset }>('/home/feed', { method: 'GET' });
      get().bootstrap(response.data);
      set({ isLoading: false }); // CRITICAL FIX: End loading state
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchNextPage: async () => {
    const s = get();
    if (s.isLoading || !s.hasMore) return;

    set({ isLoading: true });
    try {
      const nextPage = s.page + 1;
      const excludeIds = s.readPostIds.join(',');
      const response = await autoRequest<{ success: boolean; data: FeedDataset }>(
        `/home/feed?page=${nextPage}&limit=5&excludeIds=${excludeIds}`,
        { method: 'GET' }
      );
      const data = response.data;

      if (data.posts.length === 0) {
        set({ hasMore: false, isLoading: false });
        return;
      }

      const users = { ...s.users };
      const posts = { ...s.posts };
      const comments = { ...s.comments };
      const postIds = [...s.postIds];
      const readPostIds = [...s.readPostIds];
      const commentsByPostId = { ...s.commentsByPostId };

      data.users.forEach((u) => {
        const normalizedUser = {
          ...u,
          avatarUrl: u.avatarUrl || u.avatar,
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          username: u.username || u.email.split('@')[0],
        };
        users[u.id] = normalizedUser;
      });
      data.posts.forEach((p) => {
        if (!posts[p.id]) {
          posts[p.id] = {
            ...p,
            reactionSummary: { ...emptyReactions, ...(p.reactionSummary || {}) },
            media: p.media || [],
            myReaction: p.myReaction ?? null,
            bookmarkedByMe: Boolean(p.bookmarkedByMe),
          };
          postIds.push(p.id);
          readPostIds.push(p.id);
        }
      });

      data.comments.forEach((c) => {
        comments[c.id] = { ...c, likedByMe: Boolean(c.likedByMe) };
        commentsByPostId[c.postId] = commentsByPostId[c.postId] || [];
        if (!commentsByPostId[c.postId].includes(c.id)) {
          commentsByPostId[c.postId].push(c.id);
        }
      });

      set({
        users,
        posts,
        comments,
        postIds,
        readPostIds,
        commentsByPostId,
        page: nextPage,
        hasMore: data.posts.length >= 5,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  updateUserMood: async (mood) => {
    const s = get();
    const userId = s.currentUserId;
    if (!userId) return;

    // Optimistic update
    set((state) => ({
      users: {
        ...state.users,
        [userId]: { ...state.users[userId], mood },
      },
    }));

    try {
      await autoRequest('/home/user/mood', {
        method: 'PATCH',
        body: JSON.stringify({ mood }),
      });
    } catch (err: any) {
      set({ error: err.message });
      // In a real app, you might want to rollback here
    }
  },
  updateProfile: async (data) => {
    const s = get();
    const userId = s.currentUserId;
    if (!userId) return;

    // Optimistic update
    set((state) => ({
      users: {
        ...state.users,
        [userId]: { ...state.users[userId], ...data },
      },
    }));

    try {
      await autoRequest(API_ENDPOINTS.USER.UPDATE_ME, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
  fetchUser: async (userId: string) => {
    try {
      const res = await autoRequest<{ success: boolean; data: FeedUser }>(`${API_ENDPOINTS.USER.FIND_ALL}/${userId}`);
      if (res.success && res.data) {
        const u = res.data;
        const normalizedUser = {
          ...u,
          avatarUrl: u.avatarUrl || u.avatar,
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          username: u.username || u.email.split('@')[0],
        };
        set((s) => ({
          users: {
            ...s.users,
            [normalizedUser.id]: normalizedUser,
          },
        }));
      }
    } catch (err: any) {
      console.error('Fetch user failed:', err);
    }
  },
  fetchUserProfileData: async (targetUserId) => {
    try {
      const res = await autoRequest<{ success: boolean; data: any }>(`/home/user/profile-data`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      });
      return res.data;
    } catch (err: any) {
      console.error(err);
      return { followersCount: 0, followingCount: 0, isFollowing: false };
    }
  },
  fetchUserMedia: async (targetUserId) => {
    try {
      const res = await autoRequest<{ success: boolean; data: any[] }>(`/home/user/media`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      });
      return res.data;
    } catch (err: any) {
      console.error(err);
      return [];
    }
  },
}));
