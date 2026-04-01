package com.smartcollab.home.repository;

import com.smartcollab.home.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findAllByOrderByCreatedAtDesc();
    List<Post> findAllByAuthorIdInOrderByCreatedAtDesc(java.util.Collection<String> authorIds);
}
