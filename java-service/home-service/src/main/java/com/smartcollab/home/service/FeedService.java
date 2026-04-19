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
public class FeedService {

    private final FollowerRepository followerRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final UserRepository userRepository;

    public FeedResponseDTO getFeed(String currentUserId, int page, int limit, List<String> excludeIds) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, limit);
        
        List<String> followingIds = followerRepository.findAllByFollowerId(currentUserId)
                .stream().map(Follower::getFollowingId).collect(Collectors.toList());
        
        List<Post> posts = new ArrayList<>();
        
        if (!followingIds.isEmpty()) {
            // 1. Prioritize followed users' posts that haven't been read
            posts = postRepository.findByAuthorIdInAndIdNotInOrderByCreatedAtDesc(followingIds, excludeIds, pageable);
            
            // 2. If page not full, fill with other unread posts
            if (posts.size() < limit) {
                int remaining = limit - posts.size();
                List<String> currentBatchIds = posts.stream().map(Post::getId).collect(Collectors.toList());
                List<String> totalExclude = new ArrayList<>(excludeIds);
                totalExclude.addAll(currentBatchIds);
                
                List<Post> others = postRepository.findByIdNotIn(totalExclude, org.springframework.data.domain.PageRequest.of(0, remaining));
                posts.addAll(others);
            }
        } else {
            // No following: just show unread posts
            posts = postRepository.findByIdNotIn(excludeIds, pageable);
        }
        
        // 3. Fallback: If still no posts (all read), fetch random posts to keep feed alive
        if (posts.isEmpty()) {
            posts = postRepository.findRandomPosts(limit, excludeIds);
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
