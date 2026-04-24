package com.smartcollab.home.message;

import com.smartcollab.home.config.RabbitMQConfig;
import com.smartcollab.home.model.*;
import com.smartcollab.home.repository.*;
import com.smartcollab.home.service.FeedService;
import com.smartcollab.home.service.NotificationService;
import com.smartcollab.home.service.AutoPostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Map;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class HomeMessageHandler {

    private final FeedService feedService;
    private final NotificationService notificationService;
    private final AutoPostService autoPostService;
    private final PostRepository postRepository;
    private final NewsArticleRepository newsArticleRepository;
    private final FollowerRepository followerRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @RabbitListener(queues = {RabbitMQConfig.REQUESTS_QUEUE, RabbitMQConfig.QUEUE})
    public Object handleMessage(Map<String, Object> message) {
        log.info("Received message from Gateway: {}", message);
        
        Object patternObj = message.get("pattern");
        log.info("Pattern Object Type: {}, Content: {}", patternObj != null ? patternObj.getClass().getName() : "null", patternObj);
        
        String cmd = "";
        if (patternObj instanceof Map) {
            cmd = (String) ((Map<?, ?>) patternObj).get("cmd");
        } else if (patternObj instanceof String) {
            cmd = (String) patternObj;
        }
        log.info("Extracted Command: '{}'", cmd);

        Map<String, Object> data = (Map<String, Object>) message.get("data");
        log.info("Data Object: {}", data);
        
        String userId = data != null ? (String) data.get("userId") : null;
        Map<String, Object> payload = (data != null && data.get("payload") != null) 
            ? (Map<String, Object>) data.get("payload") 
            : data;
        
        log.info("UserId: {}, Payload: {}", userId, payload);

        try {
            switch (cmd) {
                case "home.feed.get":
                    int page = payload != null && payload.get("page") != null ? Integer.parseInt(String.valueOf(payload.get("page"))) : 0;
                    int limit = payload != null && payload.get("limit") != null ? Integer.parseInt(String.valueOf(payload.get("limit"))) : 10;
                    List<String> excludeIds = new ArrayList<>();
                    if (payload != null && payload.get("excludeIds") != null) {
                        Object ex = payload.get("excludeIds");
                        if (ex instanceof List) {
                            excludeIds = (List<String>) ex;
                        } else if (ex instanceof String s && !s.isEmpty()) {
                            excludeIds = java.util.Arrays.asList(s.split(","));
                        }
                    }
                    return feedService.getFeed(userId, page, limit, excludeIds);

                case "home.post.create":
                    Post post = new Post();
                    post.setAuthorId(userId);
                    post.setTitle((String) payload.get("title"));
                    post.setContent((String) payload.get("content"));
                    post.setLinkUrl((String) payload.get("linkUrl"));
                    post.setMedia((List<Map<String, Object>>) payload.get("media"));
                    post.setVisibility((String) payload.get("visibility"));
                    post.setMood((String) payload.get("mood"));
                    post.setBackgroundStyle((String) payload.get("backgroundStyle"));
                    
                    post.setCreatedAt(LocalDateTime.now());
                    post.setUpdatedAt(LocalDateTime.now());
                    Post savedPost = postRepository.save(post);
                    
                    // Notify followers
                    List<Follower> followers = followerRepository.findAllByFollowingId(userId);
                    for (Follower f : followers) {
                        notificationService.createNotification(f.getFollowerId(), userId, "NEW_POST", savedPost.getId(), null);
                    }
                    return savedPost;

                case "home.user.follow":
                    String targetId = (String) payload.get("targetId");
                    if (targetId != null && !followerRepository.existsByFollowerIdAndFollowingId(userId, targetId)) {
                        Follower f = new Follower();
                        f.setFollowerId(userId);
                        f.setFollowingId(targetId);
                        f.setCreatedAt(LocalDateTime.now());
                        followerRepository.save(f);
                        notificationService.createNotification(targetId, userId, "FOLLOW", null, null);
                    }
                    return Map.of("success", true);

                case "home.user.unfollow":
                    String unfollowId = (String) payload.get("targetId");
                    followerRepository.findByFollowerIdAndFollowingId(userId, unfollowId)
                            .ifPresent(followerRepository::delete);
                    return Map.of("success", true);

                case "home.user.mood.update":
                    String mood = (String) payload.get("mood");
                    User u = userRepository.findById(userId).orElseThrow();
                    u.setMood(mood);
                    userRepository.save(u);
                    return Map.of("success", true, "mood", mood != null ? mood : "");

                case "home.user.sync":
                    String sId = (String) payload.get("id");
                    User sUser = userRepository.findById(sId).orElse(new User());
                    sUser.setId(sId);
                    sUser.setEmail((String) payload.get("email"));
                    sUser.setFirstName((String) payload.get("firstName"));
                    sUser.setLastName((String) payload.get("lastName"));
                    sUser.setAvatar((String) payload.get("avatar"));
                    sUser.setCoverImage((String) payload.get("coverImage"));
                    sUser.setBio((String) payload.get("bio"));
                    sUser.setLocation((String) payload.get("location"));
                    sUser.setWebsite((String) payload.get("website"));
                    sUser.setBirthday((String) payload.get("birthday"));
                    sUser.setCreatedAt(payload.get("createdAt") != null ? String.valueOf(payload.get("createdAt")) : null);
                    if (payload.containsKey("mood")) sUser.setMood((String) payload.get("mood"));
                    if (payload.containsKey("role")) sUser.setRole((String) payload.get("role"));
                    userRepository.save(sUser);
                    log.info("Synced user: {}", sId);
                    return null;

                case "home.post.like":
                    String postId = (String) payload.get("postId");
                    String type = (String) payload.get("type");
                    Post p = postRepository.findById(postId).orElseThrow();
                    Reaction reaction = reactionRepository.findByPostIdAndAuthorId(postId, userId)
                            .orElse(new Reaction());
                    reaction.setPostId(postId);
                    reaction.setAuthorId(userId);
                    reaction.setType(type.toUpperCase());
                    reaction.setCreatedAt(LocalDateTime.now());
                    Reaction savedReaction = reactionRepository.save(reaction);
                    notificationService.createNotification(p.getAuthorId(), userId, "LIKE", postId, null);
                    return savedReaction;

                case "home.post.comment":
                    String pid = (String) payload.get("postId");
                    String content = (String) payload.get("content");
                    Post po = postRepository.findById(pid).orElseThrow();
                    Comment comment = new Comment();
                    comment.setPostId(pid);
                    comment.setAuthorId(userId);
                    comment.setContent(content);
                    comment.setCreatedAt(LocalDateTime.now());
                    comment.setUpdatedAt(LocalDateTime.now());
                    Comment savedComment = commentRepository.save(comment);
                    notificationService.createNotification(po.getAuthorId(), userId, "COMMENT", pid, savedComment.getId());
                    return savedComment;

                case "home.notification.list":
                    return notificationRepository.findAllByRecipientIdOrderByCreatedAtDesc(userId);

                case "home.notification.read":
                    String notificationId = (String) payload.get("notificationId");
                    Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, userId).orElse(null);
                    if (notification == null) {
                        return Map.of("success", false, "message", "Notification not found");
                    }
                    notification.setRead(true);
                    notificationRepository.save(notification);
                    return Map.of("success", true, "id", notification.getId());

                case "home.autopost.settings.get":
                    return autoPostService.getSettings();

                case "home.autopost.settings.update":
                    return autoPostService.updateSettings(payload);

                case "home.autopost.run-now":
                    String topic = payload != null && payload.get("topic") != null
                            ? String.valueOf(payload.get("topic"))
                            : "tin tuc he thong";
                    return autoPostService.runNow("MANUAL_ADMIN", topic, null);

                case "home.news.list":
                    return listNewsArticlesFiltered(payload);

                case "home.news.get": {
                    if (payload == null || payload.get("id") == null) {
                        return Map.of("success", false, "message", "id required");
                    }
                    String getId = String.valueOf(payload.get("id")).trim();
                    if (getId.isEmpty()) {
                        return Map.of("success", false, "message", "id required");
                    }
                    Optional<NewsArticle> found = newsArticleRepository.findById(getId);
                    if (found.isPresent()) {
                        return found.get();
                    }
                    return Map.of("success", false, "message", "Not found");
                }

                case "home.news.create":
                    NewsArticle newsPost = new NewsArticle();
                    newsPost.setAuthorId(userId);
                    newsPost.setCategory(normalizeNewsCategory(payload != null ? payload.get("category") : null));
                    newsPost.setContent((String) payload.get("content"));
                    newsPost.setLinkUrl(extractLinkUrl(payload));
                    newsPost.setMedia(safeMediaList(payload != null ? payload.get("media") : null));
                    newsPost.setCreatedAt(LocalDateTime.now());
                    newsPost.setUpdatedAt(LocalDateTime.now());
                    return newsArticleRepository.save(newsPost);

                case "home.news.update":
                    String newsId = (String) payload.get("id");
                    NewsArticle existingPost = newsArticleRepository.findById(newsId).orElse(null);
                    if (existingPost == null) {
                        return Map.of("success", false, "message", "Post not found");
                    }
                    if (payload.get("content") != null) {
                        existingPost.setContent((String) payload.get("content"));
                    }
                    if (payload.containsKey("category") && payload.get("category") != null) {
                        existingPost.setCategory(normalizeNewsCategory(payload.get("category")));
                    }
                    if (payload.containsKey("linkUrl")) {
                        existingPost.setLinkUrl(extractLinkUrl(payload));
                    }
                    if (payload.containsKey("media")) {
                        existingPost.setMedia(safeMediaList(payload.get("media")));
                    }
                    existingPost.setUpdatedAt(LocalDateTime.now());
                    return newsArticleRepository.save(existingPost);

                case "home.news.delete":
                    String deleteId = (String) payload.get("id");
                    NewsArticle deletingPost = newsArticleRepository.findById(deleteId).orElse(null);
                    if (deletingPost == null) {
                        return Map.of("success", false, "message", "Post not found");
                    }
                    newsArticleRepository.delete(deletingPost);
                    return Map.of("success", true, "id", deleteId);
                
                case "home.notification.create":
                    notificationService.createNotification(
                        (String) payload.get("recipientId"),
                        (String) payload.get("senderId"),
                        (String) payload.get("type"),
                        (String) payload.get("postId"),
                        (String) payload.get("commentId"),
                        (String) payload.get("projectId"),
                        (String) payload.get("projectName")
                    );
                    return null; // Return null to avoid "ReplyTo" error for async events

                case "home.user.media.get": {
                    String mUserId = (String) payload.get("targetUserId");
                    List<Post> userPosts = postRepository.findAllByAuthorIdOrderByCreatedAtDesc(mUserId);
                    List<Map<String, Object>> allMedia = new ArrayList<>();
                    for (Post postObj : userPosts) {
                        if (postObj.getMedia() != null) {
                            allMedia.addAll(postObj.getMedia());
                        }
                    }
                    return allMedia;
                }

                case "home.user.profile.data": {
                    String pUserId = (String) payload.get("targetUserId");
                    List<Follower> profileFollowers = followerRepository.findAllByFollowingId(pUserId);
                    List<Follower> profileFollowing = followerRepository.findAllByFollowerId(pUserId);
                    
                    boolean isFollowing = false;
                    if (userId != null) {
                        isFollowing = followerRepository.existsByFollowerIdAndFollowingId(userId, pUserId);
                    }

                    return Map.of(
                        "followersCount", profileFollowers.size(),
                        "followingCount", profileFollowing.size(),
                        "isFollowing", isFollowing
                    );
                }
                
                case "home.search.global":
                    String query = payload != null && payload.get("q") != null ? String.valueOf(payload.get("q")).trim() : "";
                    log.info("Global Search Query: '{}'", query);
                    if (query.isEmpty()) {
                        return Map.of("news", new ArrayList<>(), "posts", new ArrayList<>());
                    }
                    
                    // Improved word-based search (AND logic across words, any order)
                    String[] words = query.split("\\s+");
                    StringBuilder sb = new StringBuilder();
                    for (String w : words) {
                        sb.append("(?=.*").append(java.util.regex.Pattern.quote(w)).append(")");
                    }
                    sb.append(".*");
                    String regex = sb.toString();
                    log.info("Search Regex: '{}'", regex);
                    
                    List<NewsArticle> news = newsArticleRepository.findByTitleRegexOrContentRegex(regex, regex);
                    List<Post> posts = postRepository.findByTitleRegexOrContentRegex(regex, regex);
                    log.info("Global Search Results: News found: {}, Posts found: {}", news.size(), posts.size());
                    
                    return Map.of(
                        "news", news,
                        "posts", posts
                    );

                default:
                    log.warn("Unknown command: {}", cmd);
                    return Map.of("error", "Unknown command");
            }
        } catch (Exception e) {
            log.error("Error processing message", e);
            return Map.of("error", e.getMessage());
        }
    }

    private Map<String, Object> listNewsArticlesFiltered(Map<String, Object> payload) {
        List<NewsArticle> all = newsArticleRepository.findAllByOrderByCreatedAtDesc();
        
        // 1. Filter by category
        String cat = (payload != null && payload.get("category") != null) ? String.valueOf(payload.get("category")).trim() : "";
        List<NewsArticle> filtered = all;
        if (!cat.isEmpty()) {
            if ("NEWS".equalsIgnoreCase(cat)) {
                filtered = all.stream()
                        .filter(a -> a.getCategory() == null || a.getCategory().isBlank() || "NEWS".equalsIgnoreCase(a.getCategory()))
                        .toList();
            } else {
                filtered = all.stream()
                        .filter(a -> cat.equalsIgnoreCase(a.getCategory()))
                        .toList();
            }
        }

        // 2. Filter by search query (q)
        String q = (payload != null && payload.get("q") != null) ? String.valueOf(payload.get("q")).trim().toLowerCase() : "";
        if (!q.isEmpty()) {
            filtered = filtered.stream()
                    .filter(a -> (a.getContent() != null && a.getContent().toLowerCase().contains(q)) ||
                                (a.getLinkUrl() != null && a.getLinkUrl().toLowerCase().contains(q)))
                    .toList();
        }

        int total = filtered.size();

        // 3. Pagination
        int page = (payload != null && payload.get("page") != null) ? Integer.parseInt(String.valueOf(payload.get("page"))) : 0;
        int limit = (payload != null && payload.get("limit") != null) ? Integer.parseInt(String.valueOf(payload.get("limit"))) : 10;
        
        if (page < 0) page = 0;
        if (limit <= 0) limit = 10;

        int fromIndex = page * limit;
        if (fromIndex >= filtered.size()) {
            return Map.of("data", new ArrayList<>(), "total", total, "page", page, "limit", limit);
        }
        
        int toIndex = Math.min(fromIndex + limit, filtered.size());
        List<NewsArticle> paginated = filtered.subList(fromIndex, toIndex);

        return Map.of(
            "data", paginated,
            "total", total,
            "page", page,
            "limit", limit
        );
    }

    private static String normalizeNewsCategory(Object raw) {
        if (raw == null) {
            return "NEWS";
        }
        String s = String.valueOf(raw).trim().toUpperCase();
        if ("TIP".equals(s)) {
            return "TIP";
        }
        return "NEWS";
    }

    private static String extractLinkUrl(Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("linkUrl")) {
            return null;
        }
        Object v = payload.get("linkUrl");
        if (v == null) {
            return null;
        }
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? null : s;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> safeMediaList(Object raw) {
        if (raw == null) {
            return new ArrayList<>();
        }
        if (raw instanceof List<?> list) {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    out.add((Map<String, Object>) m);
                }
            }
            return out;
        }
        return new ArrayList<>();
    }

    @RabbitListener(queues = RabbitMQConfig.AI_EVENTS_QUEUE)
    public void handleAiProjectEvents(Map<String, Object> event) {
        autoPostService.onAiProjectBuilt(event);
    }
}
