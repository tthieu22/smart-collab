package com.smartcollab.home.repository;

import com.smartcollab.home.model.AutoPostEventLog;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AutoPostEventLogRepository extends MongoRepository<AutoPostEventLog, String> {
    boolean existsByEventKey(String eventKey);
}
