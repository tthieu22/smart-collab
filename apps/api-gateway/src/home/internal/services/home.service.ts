import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FeedResponseDTO, PostDTO, UserDTO, CommentDTO } from '../dto/home.dto';

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getFeed(currentUserId: string, page: number, limit: number, excludeIds: string[] = []): Promise<FeedResponseDTO> {
    const skip = page * limit;

    // 1. Get following IDs
    const followings = await this.prisma.follower.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const followingIds = followings.map((f: any) => f.followingId);

    let posts = [];

    if (followingIds.length > 0) {
      // 1. Prioritize followed users' posts
      posts = await this.prisma.post.findMany({
        where: {
          authorId: { in: followingIds },
          id: { notIn: excludeIds },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      });

      // 2. Fill if needed
      if (posts.length < limit) {
        const remaining = limit - posts.length;
        const currentBatchIds = posts.map((p: any) => p.id);
        const others = await this.prisma.post.findMany({
          where: {
            id: { notIn: [...excludeIds, ...currentBatchIds] },
          },
          orderBy: { createdAt: 'desc' },
          take: remaining,
        });
        posts = [...posts, ...others];
      }
    } else {
      posts = await this.prisma.post.findMany({
        where: { id: { notIn: excludeIds } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      });
    }

    // Fallback: random posts if empty (using $sample)
    if (posts.length === 0) {
      const pipeline: any[] = [];
      if (excludeIds.length > 0) {
        pipeline.push({
          $match: {
            _id: {
              $nin: excludeIds.map((id) => ({ $oid: id })),
            },
          },
        });
      }
      pipeline.push({ $sample: { size: limit } });

      try {
        const rawPosts = await this.prisma.post.aggregateRaw({
          pipeline,
        }) as any;

        // Map _id to id for consistency
        posts = rawPosts.map((p: any) => ({
          ...p,
          id: p._id.$oid || p._id,
          createdAt: p.createdAt?.$date ? new Date(p.createdAt.$date) : p.createdAt,
          updatedAt: p.updatedAt?.$date ? new Date(p.updatedAt.$date) : p.updatedAt,
        }));
      } catch (err) {
        this.logger.error('Failed to fetch random posts:', err);
        // Last fallback
        posts = await this.prisma.post.findMany({ take: limit });
      }
    }

    const postIds = posts.map((p: any) => p.id);
    const authorIds = new Set<string>(posts.map((p: any) => p.authorId as string));
    authorIds.add(currentUserId);

    // Fetch comments
    const allComments = await this.prisma.comment.findMany({
      where: { postId: { in: postIds } },
    });
    allComments.forEach((c: any) => authorIds.add(c.authorId as string));

    // Group comments by post
    const commentsByPostId = allComments.reduce((acc: any, c: any) => {
      if (!acc[c.postId]) acc[c.postId] = [];
      acc[c.postId].push(c);
      return acc;
    }, {});

    // Fetch reactions
    const allReactions = await this.prisma.reaction.findMany({
      where: { postId: { in: postIds } },
    });

    // Group reactions by post
    const reactionsByPostId = allReactions.reduce((acc: any, r: any) => {
      if (!acc[r.postId]) acc[r.postId] = [];
      acc[r.postId].push(r);
      return acc;
    }, {});

    // Fetch users
    const users = await this.prisma.user.findMany({
      where: { id: { in: Array.from(authorIds) } },
    });

    const userDTOs: UserDTO[] = users.map((u: any) => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      username: u.email ? u.email.split('@')[0] : 'user',
      email: u.email,
      avatarUrl: u.avatar,
      coverImage: u.coverImage,
      bio: u.bio,
      location: u.location,
      website: u.website,
      birthday: u.birthday?.toISOString(),
      mood: (u as any).mood,
      verified: u.role === 'ADMIN',
      createdAt: u.createdAt,
    }));

    const postDTOs: PostDTO[] = posts.map((post: any) => {
      const postReactions = reactionsByPostId[post.id] || [];
      const postComments = commentsByPostId[post.id] || [];

      const summary = postReactions.reduce((acc: any, r: any) => {
        const type = r.type.toLowerCase();
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 });

      const myReaction = postReactions.find((r: any) => r.authorId === currentUserId);

      return {
        id: post.id,
        authorId: post.authorId,
        content: post.content,
        media: post.media,
        createdAt: post.createdAt,
        commentCount: postComments.length,
        shareCount: 0,
        reactionSummary: summary,
        myReaction: myReaction ? myReaction.type.toLowerCase() : null,
        bookmarkedByMe: false,
        visibility: 'PUBLIC', // Default
        mood: (post as any).mood,
        title: (post as any).title,
        backgroundStyle: (post as any).backgroundStyle,
      };
    });

    const commentDTOs: CommentDTO[] = allComments.map((c: any) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      content: c.content,
      createdAt: c.createdAt,
      likeCount: 0,
      likedByMe: false,
    }));

    return {
      currentUserId,
      users: userDTOs,
      posts: postDTOs,
      comments: commentDTOs,
    };
  }

  async search(query: string) {
    const news = await this.prisma.newsArticle.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    const posts = await this.prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return { news, posts };
  }

  async getPostById(postId: string, currentUserId: string): Promise<PostDTO | null> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) return null;

    const reactions = await this.prisma.reaction.findMany({ where: { postId } });
    const commentCount = await this.prisma.comment.count({ where: { postId } });

    const summary = reactions.reduce((acc: any, r: any) => {
      const type = r.type.toLowerCase();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 });

    const myReaction = reactions.find((r: any) => r.authorId === currentUserId);

    return {
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      media: post.media,
      createdAt: post.createdAt,
      commentCount,
      shareCount: 0,
      reactionSummary: summary,
      myReaction: myReaction ? myReaction.type.toLowerCase() : null,
      bookmarkedByMe: false,
      visibility: 'PUBLIC',
      mood: (post as any).mood,
      title: (post as any).title,
      backgroundStyle: (post as any).backgroundStyle,
    };
  }

  async getCommentsByPostId(postId: string): Promise<CommentDTO[]> {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((c: any) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      content: c.content,
      createdAt: c.createdAt,
      likeCount: 0,
      likedByMe: false,
    }));
  }

  async listNews(category: string, page: number, limit: number, q: string = '') {
    const skip = page * limit;
    
    // Normalize category for robust matching
    const targetCat = (category || 'NEWS').toUpperCase();
    
    let where: any = {};
    if (targetCat === 'NEWS' || targetCat === 'ALL') {
      where.category = { in: ['NEWS', 'AUTO_AI'] };
    } else {
      where.category = targetCat;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    this.logger.debug(`[HomeService] listNews - category: ${targetCat}, where: ${JSON.stringify(where)}`);

    const [items, total] = await Promise.all([
      this.prisma.newsArticle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    this.logger.log(`[HomeService] listNews found ${items.length} items (total: ${total}) for category: ${targetCat}`);

    return { items, total, page, limit };
  }

  async getNewsArticle(id: string) {
    return this.prisma.newsArticle.findUnique({ where: { id } });
  }

  async getUserProfileData(userId: string) {
    // Basic implementation: stats + recent activity
    const [postCount, followerCount, followingCount] = await Promise.all([
      this.prisma.post.count({ where: { authorId: userId } }),
      this.prisma.follower.count({ where: { followingId: userId } }),
      this.prisma.follower.count({ where: { followerId: userId } }),
    ]);

    return { postCount, followerCount, followingCount };
  }

  async getUserMedia(userId: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        authorId: userId,
        media: { not: { equals: [] } } as any,
      },
      select: { media: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    
    // Flatten media
    const allMedia: any[] = [];
    posts.forEach((p: any) => {
      if (Array.isArray(p.media)) {
        p.media.forEach((m: any) => allMedia.push({ ...m, createdAt: p.createdAt }));
      }
    });
    return allMedia;
  }
}
