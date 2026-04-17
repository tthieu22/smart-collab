package com.smartcollab.home.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Bean
    public JavaMailSender mailSender() {

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        String host = System.getenv("SMTP_HOST");
        String port = System.getenv("SMTP_PORT");
        String user = System.getenv("SMTP_USER");
        String pass = System.getenv("SMTP_PASS");

        mailSender.setHost(host != null ? host : "smtp.gmail.com");
        mailSender.setPort(port != null ? Integer.parseInt(port) : 587);

        mailSender.setUsername(user);
        mailSender.setPassword(pass);

        Properties props = mailSender.getJavaMailProperties();

        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "false");

        return mailSender;
    }
}