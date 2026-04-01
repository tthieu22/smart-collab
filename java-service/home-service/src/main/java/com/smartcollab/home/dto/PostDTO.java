package com.smartcollab.home.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class PostDTO {
    private String id;
    private String authorId;
    private LocalDateTime createdAt;
    private String content;
    private List<Map<String, Object>> media;
    private Map<String, Long> reactionSummary;
    private long commentCount;
    private long shareCount;
    private String myReaction;
    private boolean bookmarkedByMe;
}
