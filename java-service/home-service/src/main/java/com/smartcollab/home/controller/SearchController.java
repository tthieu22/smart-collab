package com.smartcollab.home.controller;

import com.smartcollab.home.dto.SearchResponseDTO;
import com.smartcollab.home.model.NewsDocument;
import com.smartcollab.home.repository.NewsArticleRepository;
import com.smartcollab.home.repository.NewsSearchRepository;
import com.smartcollab.home.repository.PostRepository;
import com.smartcollab.home.repository.PostSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {
    private final NewsArticleRepository newsArticleRepository;
    private final NewsSearchRepository newsSearchRepository;
    private final PostRepository postRepository;
    private final PostSearchRepository postSearchRepository;

    @GetMapping
    public SearchResponseDTO search(@RequestParam String q) {
        // 🔍 Search News in Elasticsearch
        List<Object> newsResults = new ArrayList<>();
        try {
            // Simple keyword search in title
            // Note: In a real app, you'd use a more complex query or SearchHits
            newsResults.addAll(newsArticleRepository.findByTitleContainingIgnoreCase(q));
        } catch (Exception e) {
            // Fallback to MongoDB
            newsResults.addAll(newsArticleRepository.findByTitleContainingIgnoreCase(q));
        }

        List<Object> postResults = new ArrayList<>();
        try {
            StreamSupport.stream(postSearchRepository.findAll().spliterator(), false)
                    .filter(p -> (p.getTitle() != null && p.getTitle().toLowerCase().contains(q.toLowerCase())) 
                              || (p.getContent() != null && p.getContent().toLowerCase().contains(q.toLowerCase())))
                    .forEach(postResults::add);
        } catch (Exception e) {
            postResults.addAll(postRepository.findByTitleContainingIgnoreCase(q));
        }

        return SearchResponseDTO.builder()
                .news(newsResults)
                .posts(postResults)
                .build();
    }
}

