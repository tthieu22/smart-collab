package com.smartcollab.home.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "User")
public class User {
    @Id
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String avatar;
    private String coverImage;
    private String bio;
    private String location;
    private String website;
    private String birthday;
    private String mood;
    private String role;
    private String createdAt;
}
