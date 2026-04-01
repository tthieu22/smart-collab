package com.smartcollab.home.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "Post")
public class Post {
    @Id
    private String id;
    private String authorId;
    private String content;
    private List<Map<String, Object>> media;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
