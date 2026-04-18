package com.smartcollab.home.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "NewsArticle")
public class NewsArticle {
    @Id
    private String id;
    private String authorId;
    /** NEWS = bản tin; TIP = mẹo / hướng dẫn (hiển thị sidebar). */
    private String category;
    private String content;
    /** Liên kết ngoài tùy chọn (ví dụ “Đọc thêm”). */
    private String linkUrl;
    private List<Map<String, Object>> media;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
