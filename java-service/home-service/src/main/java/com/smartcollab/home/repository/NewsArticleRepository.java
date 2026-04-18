package com.smartcollab.home.repository;

import com.smartcollab.home.model.NewsArticle;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NewsArticleRepository extends MongoRepository<NewsArticle, String> {
    List<NewsArticle> findAllByOrderByCreatedAtDesc();
}
