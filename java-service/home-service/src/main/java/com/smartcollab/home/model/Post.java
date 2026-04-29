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
    
    @org.springframework.data.mongodb.core.index.Indexed
    private String authorId;
    
    private String title;
    private String content;
    private String linkUrl;
    private List<Map<String, Object>> media;
    private String visibility; // public, friends, private
    private String mood;
    private String backgroundStyle;
    
    @org.springframework.data.mongodb.core.index.Indexed
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
