package com.smartcollab.home.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "AutoPostSettings")
public class AutoPostSettings {
    @Id
    private String id;
    private boolean enabled;
    private boolean eventTriggerEnabled;
    private int postCountPerRun;
    private int intervalMinutes;
    private String contentTemplate;
    private String locale;
    private java.util.List<String> rssSources;
    private int topicTrackingDays;
    private LocalDateTime lastRunAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
