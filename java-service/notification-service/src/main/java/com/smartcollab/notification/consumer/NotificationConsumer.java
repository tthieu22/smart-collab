package com.smartcollab.notification.consumer;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationConsumer {

    @RabbitListener(queues = "notification.queue")
    public void handleNotification(String message) {

        System.out.println("Received event: " + message);

    }
}