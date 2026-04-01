package com.smartcollab.home.repository;

import com.smartcollab.home.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findAllByRecipientIdOrderByCreatedAtDesc(String recipientId);
}
