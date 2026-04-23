package com.smartcollab.home.repository;

import com.smartcollab.home.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);
    List<Post> findAllByAuthorIdInOrderByCreatedAtDesc(java.util.Collection<String> authorIds, org.springframework.data.domain.Pageable pageable);
    List<Post> findByIdNotIn(java.util.Collection<String> ids, org.springframework.data.domain.Pageable pageable);
    List<Post> findByAuthorIdInAndIdNotInOrderByCreatedAtDesc(java.util.Collection<String> authorIds, java.util.Collection<String> ids, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.mongodb.repository.Aggregation(pipeline = {
        "{ $match: { _id: { $nin: ?1 } } }",
        "{ $sample: { size: ?0 } }"
    })
    List<Post> findRandomPosts(int size, java.util.Collection<String> excludeIds);
    List<Post> findByTitleContainingIgnoreCase(String title);
    List<Post> findByTitleRegex(String regex);
    @org.springframework.data.mongodb.repository.Query("{ '$or': [ { 'title': { '$regex': ?0, '$options': 'i' } }, { 'content': { '$regex': ?1, '$options': 'i' } } ] }")
    List<Post> findByTitleRegexOrContentRegex(String titleRegex, String contentRegex);
}
