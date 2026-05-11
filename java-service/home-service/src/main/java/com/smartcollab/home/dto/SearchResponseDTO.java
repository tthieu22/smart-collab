package com.smartcollab.home.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SearchResponseDTO {
    private List<Object> news;
    private List<Object> posts;
}
