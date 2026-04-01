package com.smartcollab.home.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "Follower")
public class Follower {
    @Id
    private String id;
    private String followerId;
    private String followingId;
    private LocalDateTime createdAt;
}
