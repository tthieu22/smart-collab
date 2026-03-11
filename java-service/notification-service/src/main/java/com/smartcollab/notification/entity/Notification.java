package com.smartcollab.notification.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class Notification {

 @Id
 private String id;

 private String userId;

 private String message;

 private Boolean read;

 private LocalDateTime createdAt;

 public Notification() {}

}