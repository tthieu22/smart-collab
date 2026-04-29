package com.smartcollab.home.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "Reaction")
public class Reaction {
    @Id
    private String id;
    
    @org.springframework.data.mongodb.core.index.Indexed
    private String postId;
    
    private String authorId;
    private String type;
    private LocalDateTime createdAt;
}
