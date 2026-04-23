package com.smartcollab.home.repository;

import com.smartcollab.home.model.NewsArticle;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NewsArticleRepository extends MongoRepository<NewsArticle, String> {
    List<NewsArticle> findAllByOrderByCreatedAtDesc();
    List<NewsArticle> findByTitleContainingIgnoreCase(String title);
    List<NewsArticle> findByTitleRegex(String regex);
    @org.springframework.data.mongodb.repository.Query("{ '$or': [ { 'title': { '$regex': ?0, '$options': 'i' } }, { 'content': { '$regex': ?1, '$options': 'i' } } ] }")
    List<NewsArticle> findByTitleRegexOrContentRegex(String titleRegex, String contentRegex);
}
