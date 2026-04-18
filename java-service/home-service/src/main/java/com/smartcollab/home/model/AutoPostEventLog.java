package com.smartcollab.home.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "AutoPostEventLog")
public class AutoPostEventLog {
    @Id
    private String id;
    private String eventKey;
    private LocalDateTime createdAt;
}
