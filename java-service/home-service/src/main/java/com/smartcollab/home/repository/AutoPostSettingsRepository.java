package com.smartcollab.home.repository;

import com.smartcollab.home.model.AutoPostSettings;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AutoPostSettingsRepository extends MongoRepository<AutoPostSettings, String> {
}
