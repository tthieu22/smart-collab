import { IsString, IsOptional, IsInt, IsBoolean, IsArray } from 'class-validator';

export class UserDTO {
  id!: string;
  name!: string;
  username!: string;
  email!: string;
  avatarUrl?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthday?: string;
  mood?: string;
  verified!: boolean;
  createdAt?: string | Date;
}

export class PostDTO {
  id!: string;
  authorId!: string;
  content!: string;
  media?: any;
  createdAt!: string | Date;
  commentCount!: number;
  shareCount!: number;
  reactionSummary!: Record<string, number>;
  myReaction?: string | null;
  bookmarkedByMe!: boolean;
  visibility!: string;
  mood?: string;
  backgroundStyle?: string;
  title?: string;
  linkUrl?: string;
}

export class CommentDTO {
  id!: string;
  postId!: string;
  authorId!: string;
  content!: string;
  createdAt!: string | Date;
  likeCount!: number;
  likedByMe!: boolean;
}

export class FeedResponseDTO {
  currentUserId!: string;
  users!: UserDTO[];
  posts!: PostDTO[];
  comments!: CommentDTO[];
}

export class SearchResponseDTO {
  news!: any[];
  posts!: any[];
}
