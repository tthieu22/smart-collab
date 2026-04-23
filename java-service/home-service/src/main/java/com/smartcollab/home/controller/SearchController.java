package com.smartcollab.home.controller;

import com.smartcollab.home.dto.SearchResponseDTO;
import com.smartcollab.home.repository.NewsArticleRepository;
import com.smartcollab.home.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {
    private final NewsArticleRepository newsArticleRepository;
    private final PostRepository postRepository;

    @GetMapping
    public SearchResponseDTO search(@RequestParam String q) {
        return SearchResponseDTO.builder()
                .news(newsArticleRepository.findByTitleContainingIgnoreCase(q))
                .posts(postRepository.findByTitleContainingIgnoreCase(q))
                .build();
    }
}
