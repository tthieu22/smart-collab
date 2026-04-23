package com.smartcollab.home.dto;

import com.smartcollab.home.model.NewsArticle;
import com.smartcollab.home.model.Post;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SearchResponseDTO {
    private List<NewsArticle> news;
    private List<Post> posts;
}
