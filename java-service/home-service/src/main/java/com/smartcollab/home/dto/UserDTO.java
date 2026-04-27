package com.smartcollab.home.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDTO {
    private String id;
    private String name;
    private String username;
    private String email;
    private String avatarUrl;
    private String coverImage;
    private String bio;
    private String location;
    private String website;
    private String birthday;
    private String mood;
    private boolean verified;
    private String createdAt;
}
