package com.smartcollab.notification.consumer;

import com.smartcollab.notification.dto.NotificationMessage;
import com.smartcollab.notification.service.NotificationService;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationConsumer {

    private final NotificationService notificationService;

    public NotificationConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = "notification.queue")
    public void receive(NotificationMessage message) {

        System.out.println("📩 Received message: " + message.getTitle());

        notificationService.process(message);
    }
    
}