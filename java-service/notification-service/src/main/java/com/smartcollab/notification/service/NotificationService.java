package com.smartcollab.notification.service;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationService {

 public List<String> getNotifications(){

  return List.of("Task assigned","Card created");

 }

}