package com.smartcollab.home.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CommentDTO {
    private String id;
    private String postId;
    private String authorId;
    private String content;
    private LocalDateTime createdAt;
    private long likeCount;
    private boolean likedByMe;
}
