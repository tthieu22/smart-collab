package com.smartcollab.home.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "Notification")
public class Notification {
    @Id
    private String id;
    private String recipientId;
    private String senderId;
    private String type;
    private String postId;
    private String commentId;
    private boolean isRead;
    private LocalDateTime createdAt;
}
