export type FeedID = string;

export interface FeedUser {
  id: FeedID;
  name: string;
  username: string;
  avatarUrl?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  birthday?: string | null;
  mood?: string | null;
  verified?: boolean;
  createdAt?: string;
}

export type FeedMediaType = 'image' | 'video';

export interface FeedMedia {
  id: FeedID;
  type: FeedMediaType;
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

export type FeedReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface FeedReactionSummary {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
}

export interface FeedComment {
  id: FeedID;
  postId: FeedID;
  authorId: FeedID;
  content: string;
  createdAt: string; // ISO
  likeCount: number;
  likedByMe?: boolean;
}

export interface FeedPost {
  id: FeedID;
  authorId: FeedID;
  createdAt: string; // ISO
  title?: string;
  content: string;
  linkUrl?: string;
  media?: FeedMedia[];

  reactionSummary: FeedReactionSummary;
  commentCount: number;
  shareCount: number;

  myReaction?: FeedReactionType | null;
  bookmarkedByMe?: boolean;

  visibility?: 'public' | 'friends' | 'private';
  mood?: string | null;
  backgroundStyle?: string | null;
}

export interface FeedDataset {
  currentUserId: FeedID;
  users: FeedUser[];
  posts: FeedPost[];
  comments: FeedComment[];
}

