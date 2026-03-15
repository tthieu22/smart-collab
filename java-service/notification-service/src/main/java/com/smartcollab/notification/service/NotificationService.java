package com.smartcollab.notification.service;

import com.smartcollab.notification.dto.NotificationMessage;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    public void process(NotificationMessage message) {

        if ("EMAIL".equals(message.getType())) {

            System.out.println("📧 Send email to: " + message.getEmail());
            System.out.println("Title: " + message.getTitle());
            System.out.println("Content: " + message.getContent());

        }

        if ("SYSTEM".equals(message.getType())) {

            System.out.println("🔔 System notification: " + message.getContent());

        }
    }
}