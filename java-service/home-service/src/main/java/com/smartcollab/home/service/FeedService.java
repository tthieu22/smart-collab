package com.smartcollab.home.service;

import com.smartcollab.home.dto.*;
import com.smartcollab.home.model.*;
import com.smartcollab.home.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
    private final FollowerRepository followerRepository;

    public FeedResponseDTO getFeed(String currentUserId) {
        List<String> followingIds = followerRepository.findAllByFollowerId(currentUserId)
                .stream().map(Follower::getFollowingId).collect(Collectors.toList());
        
        List<Post> posts;
        if (!followingIds.isEmpty()) {
            // Prioritize followed users' posts
            posts = postRepository.findAllByAuthorIdInOrderByCreatedAtDesc(followingIds);
            
            // If few followed posts, fill with others
            if (posts.size() < 10) {
                List<Post> others = postRepository.findAllByOrderByCreatedAtDesc();
                // Avoid duplicates
                Set<String> postIds = posts.stream().map(Post::getId).collect(Collectors.toSet());
                for (Post p : others) {
                    if (!postIds.contains(p.getId())) {
                        posts.add(p);
                        if (posts.size() >= 20) break;
                    }
                }
            }
        } else {
            posts = postRepository.findAllByOrderByCreatedAtDesc();
        }
        
        // Collect all author IDs to fetch users in one batch
        Set<String> userIds = new HashSet<>();
        userIds.add(currentUserId);
        userIds.addAll(posts.stream().map(Post::getAuthorId).collect(Collectors.toSet()));
        
        List<Comment> allComments = new ArrayList<>();
        for (Post post : posts) {
            List<Comment> postComments = commentRepository.findAllByPostId(post.getId());
            allComments.addAll(postComments);
            userIds.addAll(postComments.stream().map(Comment::getAuthorId).collect(Collectors.toSet()));
        }

        List<UserDTO> userDTOs = userRepository.findAllById(userIds).stream().map(u -> {
            String firstName = u.getFirstName() != null ? u.getFirstName() : "";
            String lastName = u.getLastName() != null ? u.getLastName() : "";
            return UserDTO.builder()
                .id(u.getId())
                .name((firstName + " " + lastName).trim())
                .username(u.getEmail() != null ? u.getEmail().split("@")[0] : "user")
                .avatarUrl(u.getAvatar())
                .verified(u.getRole() != null && u.getRole().equals("ADMIN"))
                .build();
        }).collect(Collectors.toList());

        List<PostDTO> postDTOs = posts.stream().map(post -> {
            Map<String, Long> summary = new HashMap<>();
            String[] types = {"LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"};
            for (String type : types) {
                summary.put(type.toLowerCase(), reactionRepository.countByPostIdAndType(post.getId(), type));
            }
            
            Optional<Reaction> myReaction = reactionRepository.findByPostIdAndAuthorId(post.getId(), currentUserId);
            
            return PostDTO.builder()
                    .id(post.getId())
                    .authorId(post.getAuthorId())
                    .content(post.getContent())
                    .media(post.getMedia())
                    .createdAt(post.getCreatedAt())
                    .commentCount(commentRepository.countByPostId(post.getId()))
                    .reactionSummary(summary)
                    .myReaction(myReaction.map(r -> r.getType().toLowerCase()).orElse(null))
                    .bookmarkedByMe(false) // logic not implemented yet
                    .build();
        }).collect(Collectors.toList());

        List<CommentDTO> commentDTOs = allComments.stream().map(c -> 
            CommentDTO.builder()
                .id(c.getId())
                .postId(c.getPostId())
                .authorId(c.getAuthorId())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .likeCount(0) // logic pending
                .likedByMe(false)
                .build()
        ).collect(Collectors.toList());

        return FeedResponseDTO.builder()
                .currentUserId(currentUserId)
                .users(userDTOs)
                .posts(postDTOs)
                .comments(commentDTOs)
                .build();
    }
}
