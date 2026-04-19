package com.smartcollab.home.service;

import com.smartcollab.home.model.Notification;
import com.smartcollab.home.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final RabbitTemplate rabbitTemplate;

    public void createNotification(String recipientId, String senderId, String type, String postId, String commentId) {
        createNotification(recipientId, senderId, type, postId, commentId, null, null);
    }

    public void createNotification(String recipientId, String senderId, String type, String postId, String commentId, String projectId, String projectName) {
        if (recipientId.equals(senderId)) return; // Don't notify self

        Notification notification = new Notification();
        notification.setRecipientId(recipientId);
        notification.setSenderId(senderId);
        notification.setType(type);
        notification.setPostId(postId);
        notification.setCommentId(commentId);
        notification.setProjectId(projectId);
        notification.setProjectName(projectName);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(notification);

        // Publish to RabbitMQ for Realtime service
        Map<String, Object> message = new HashMap<>();
        message.put("id", notification.getId());
        message.put("recipientId", recipientId);
        message.put("senderId", senderId);
        message.put("type", type);
        message.put("postId", postId);
        message.put("commentId", commentId);
        message.put("projectId", projectId);
        message.put("projectName", projectName);
        message.put("createdAt", notification.getCreatedAt().toString());

        rabbitTemplate.convertAndSend("notification_exchange", "notification_routing_key", message);
    }
}
