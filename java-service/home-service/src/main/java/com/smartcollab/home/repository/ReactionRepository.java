package com.smartcollab.home.repository;

import com.smartcollab.home.model.Reaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends MongoRepository<Reaction, String> {
    List<Reaction> findAllByPostId(String postId);
    Optional<Reaction> findByPostIdAndAuthorId(String postId, String authorId);
    long countByPostIdAndType(String postId, String type);
    List<Reaction> findByPostIdIn(java.util.Collection<String> postIds);
}
