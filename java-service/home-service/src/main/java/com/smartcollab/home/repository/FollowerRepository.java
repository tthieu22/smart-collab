package com.smartcollab.home.repository;

import com.smartcollab.home.model.Follower;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface FollowerRepository extends MongoRepository<Follower, String> {
    List<Follower> findAllByFollowerId(String followerId);
    List<Follower> findAllByFollowingId(String followingId);
    Optional<Follower> findByFollowerIdAndFollowingId(String followerId, String followingId);
    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);
}
