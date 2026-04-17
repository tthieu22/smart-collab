package com.smartcollab.home.message;

import com.smartcollab.home.config.RabbitMQConfig;
import com.smartcollab.home.model.*;
import com.smartcollab.home.repository.*;
import com.smartcollab.home.service.FeedService;
import com.smartcollab.home.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class HomeMessageHandler {

    private final FeedService feedService;
    private final NotificationService notificationService;
    private final PostRepository postRepository;
    private final FollowerRepository followerRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;

    @RabbitListener(queues = RabbitMQConfig.REQUESTS_QUEUE)
    public Object handleMessage(Map<String, Object> message) {
        log.info("Received message from Gateway: {}", message);
        
        Object patternObj = message.get("pattern");
        String cmd = "";
        if (patternObj instanceof Map) {
            cmd = (String) ((Map<?, ?>) patternObj).get("cmd");
        } else if (patternObj instanceof String) {
            cmd = (String) patternObj;
        }

        Map<String, Object> data = (Map<String, Object>) message.get("data");
        String userId = data != null ? (String) data.get("userId") : null;
        Map<String, Object> payload = (data != null && data.get("payload") != null) 
            ? (Map<String, Object>) data.get("payload") 
            : data;

        try {
            switch (cmd) {
                case "home.feed.get":
                    return feedService.getFeed(userId);

                case "home.post.create":
                    Post post = new Post();
                    post.setAuthorId(userId);
                    post.setContent((String) payload.get("content"));
                    post.setMedia((List<Map<String, Object>>) payload.get("media"));
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

                default:
                    log.warn("Unknown command: {}", cmd);
                    return Map.of("error", "Unknown command");
            }
        } catch (Exception e) {
            log.error("Error processing message", e);
            return Map.of("error", e.getMessage());
        }
    }
}
