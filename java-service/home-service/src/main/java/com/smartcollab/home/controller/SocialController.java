package com.smartcollab.home.controller;

import com.smartcollab.home.model.Comment;
import com.smartcollab.home.model.Post;
import com.smartcollab.home.model.Reaction;
import com.smartcollab.home.repository.CommentRepository;
import com.smartcollab.home.repository.PostRepository;
import com.smartcollab.home.repository.ReactionRepository;
import com.smartcollab.home.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/social")
@RequiredArgsConstructor
public class SocialController {
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final NotificationService notificationService;
    private final com.smartcollab.home.repository.UserRepository userRepository;

    @PatchMapping("/user/mood")
    public com.smartcollab.home.model.User updateMood(@RequestBody Map<String, String> payload, @RequestHeader("X-User-Id") String userId) {
        com.smartcollab.home.model.User user = userRepository.findById(userId).orElseThrow();
        user.setMood(payload.get("mood"));
        return userRepository.save(user);
    }

    @PostMapping("/post")
    public Post createPost(@RequestBody Post post, @RequestHeader("X-User-Id") String userId) {
        post.setAuthorId(userId);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        return postRepository.save(post);
    }

    @PostMapping("/post/{id}/like")
    public Reaction likePost(@PathVariable String id, @RequestParam String type, @RequestHeader("X-User-Id") String userId) {
        Post post = postRepository.findById(id).orElseThrow();
        
        Reaction reaction = reactionRepository.findByPostIdAndAuthorId(id, userId)
                .orElse(new Reaction());
        
        reaction.setPostId(id);
        reaction.setAuthorId(userId);
        reaction.setType(type.toUpperCase());
        reaction.setCreatedAt(LocalDateTime.now());
        
        Reaction saved = reactionRepository.save(reaction);
        
        // Trigger notification
        notificationService.createNotification(post.getAuthorId(), userId, "LIKE", id, null);
        
        return saved;
    }

    @PostMapping("/post/{id}/comment")
    public Comment addComment(@PathVariable String id, @RequestBody Comment comment, @RequestHeader("X-User-Id") String userId) {
        Post post = postRepository.findById(id).orElseThrow();
        
        comment.setPostId(id);
        comment.setAuthorId(userId);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        
        Comment saved = commentRepository.save(comment);
        
        // Trigger notification
        notificationService.createNotification(post.getAuthorId(), userId, "COMMENT", id, saved.getId());
        
        return saved;
    }
}
