package com.smartcollab.home.repository;

import com.smartcollab.home.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findAllByPostId(String postId);
    long countByPostId(String postId);
}
