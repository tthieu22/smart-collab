package com.smartcollab.home.repository;

import com.smartcollab.home.model.NewsDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsSearchRepository extends ElasticsearchRepository<NewsDocument, String> {
}
