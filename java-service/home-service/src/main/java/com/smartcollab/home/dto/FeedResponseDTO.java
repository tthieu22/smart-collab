package com.smartcollab.home.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class FeedResponseDTO {
    private String currentUserId;
    private List<UserDTO> users;
    private List<PostDTO> posts;
    private List<CommentDTO> comments;
}
