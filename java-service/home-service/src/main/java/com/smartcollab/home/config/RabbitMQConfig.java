package com.smartcollab.home.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;

@Configuration
public class RabbitMQConfig {
    // ... constants ...

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
    public static final String QUEUE = "notification_queue";
    public static final String REQUESTS_QUEUE = "home_requests_queue";
    public static final String EXCHANGE = "notification_exchange";
    public static final String ROUTING_KEY = "notification_routing_key";
    public static final String PROJECT_EVENTS_EXCHANGE = "project-exchange";
    public static final String AI_EVENTS_QUEUE = "home_ai_events_queue";

    @Bean
    public Queue queue() {
        return new Queue(QUEUE);
    }

    @Bean
    public Queue requestsQueue() {
        return new Queue(REQUESTS_QUEUE);
    }

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Binding binding(Queue queue, TopicExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with(ROUTING_KEY);
    }

    @Bean
    public Queue aiEventsQueue() {
        return new Queue(AI_EVENTS_QUEUE);
    }

    @Bean
    public TopicExchange projectEventsExchange() {
        return new TopicExchange(PROJECT_EVENTS_EXCHANGE);
    }

    @Bean
    public Binding aiProjectBuiltBinding(Queue aiEventsQueue, TopicExchange projectEventsExchange) {
        return BindingBuilder.bind(aiEventsQueue).to(projectEventsExchange).with("ai.project.built");
    }
}
