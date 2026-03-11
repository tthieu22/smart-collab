package com.smartcollab.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.smartcollab.notification.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification,String>{
}