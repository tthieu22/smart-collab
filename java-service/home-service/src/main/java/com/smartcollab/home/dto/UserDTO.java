package com.smartcollab.home.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDTO {
    private String id;
    private String name;
    private String username;
    private String avatarUrl;
    private boolean verified;
}
