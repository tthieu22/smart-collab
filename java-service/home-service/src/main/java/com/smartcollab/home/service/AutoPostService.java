package com.smartcollab.home.service;

import com.smartcollab.home.model.AutoPostEventLog;
import com.smartcollab.home.model.AutoPostSettings;
import com.smartcollab.home.model.NewsArticle;
import com.smartcollab.home.model.User;
import com.smartcollab.home.repository.AutoPostEventLogRepository;
import com.smartcollab.home.repository.AutoPostSettingsRepository;
import com.smartcollab.home.repository.NewsArticleRepository;
import com.smartcollab.home.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import jakarta.annotation.PostConstruct;

@Service
@Slf4j
@RequiredArgsConstructor
public class AutoPostService {
    private static final String DEFAULT_TEMPLATE = "Tao bai viet tin tuc ngan gon ve du an: {{topic}}";
    private static final int MAX_POSTS_PER_RUN = 10;
    private static final int MIN_INTERVAL_MINUTES = 1;
    private static final int DEFAULT_INTERVAL_MINUTES = 60;

    private final AutoPostSettingsRepository settingsRepository;
    private final AutoPostEventLogRepository eventLogRepository;
    private final NewsArticleRepository newsArticleRepository;
    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;

    @PostConstruct
    public void init() {
        // Increase timeout for AI heavy lifting (discovery, generation, embedding)
        this.rabbitTemplate.setReplyTimeout(120000); // 120 seconds
    }

    public AutoPostSettings getSettings() {
        return loadOrCreateSettings();
    }

    public AutoPostSettings updateSettings(Map<String, Object> payload) {
        AutoPostSettings settings = loadOrCreateSettings();
        if (payload == null) {
            return settings;
        }

        if (payload.containsKey("enabled")) {
            settings.setEnabled(Boolean.TRUE.equals(payload.get("enabled")));
        }
        if (payload.containsKey("eventTriggerEnabled")) {
            settings.setEventTriggerEnabled(Boolean.TRUE.equals(payload.get("eventTriggerEnabled")));
        }
        if (payload.containsKey("contentTemplate") && payload.get("contentTemplate") != null) {
            String template = String.valueOf(payload.get("contentTemplate")).trim();
            settings.setContentTemplate(template.isEmpty() ? DEFAULT_TEMPLATE : template);
        }
        if (payload.containsKey("locale") && payload.get("locale") != null) {
            settings.setLocale(String.valueOf(payload.get("locale")));
        }
        if (payload.containsKey("postCountPerRun")) {
            settings.setPostCountPerRun(clampInt(payload.get("postCountPerRun"), 1, MAX_POSTS_PER_RUN, 1));
        } else if (payload.containsKey("postCount")) {
            settings.setPostCountPerRun(clampInt(payload.get("postCount"), 1, MAX_POSTS_PER_RUN, 1));
        }
        if (payload.containsKey("intervalMinutes")) {
            settings.setIntervalMinutes(clampInt(payload.get("intervalMinutes"), MIN_INTERVAL_MINUTES, 1440, DEFAULT_INTERVAL_MINUTES));
        }
        if (payload.containsKey("rssSources") && payload.get("rssSources") instanceof java.util.List) {
            settings.setRssSources((java.util.List<String>) payload.get("rssSources"));
        }
        if (payload.containsKey("topicTrackingDays")) {
            settings.setTopicTrackingDays(clampInt(payload.get("topicTrackingDays"), 1, 30, 7));
        }

        settings.setUpdatedAt(LocalDateTime.now());
        return settingsRepository.save(settings);
    }

    public Map<String, Object> runNow(String source, String topic, String eventKey) {
        boolean enforceEnabled = !"MANUAL_ADMIN".equals(source);
        return runAutoPost(source, topic, eventKey, enforceEnabled);
    }

    public void onAiProjectBuilt(Map<String, Object> event) {
        AutoPostSettings settings = loadOrCreateSettings();
        if (!settings.isEnabled() || !settings.isEventTriggerEnabled()) {
            return;
        }

        String projectId = safeString(event.get("projectId"));
        if (projectId == null || projectId.isBlank()) {
            return;
        }

        String dedupKey = "ai.project.built:" + projectId;
        // Check if we already posted about this project
        if (newsArticleRepository.existsBySourceUrl(dedupKey)) {
            return;
        }

        runAutoPost("AUTO_AI_EVENT", "project " + projectId, dedupKey, true);
    }

    @Scheduled(fixedDelay = 60000)
    public void scheduledAutoPost() {
        AutoPostSettings settings = loadOrCreateSettings();
        if (!settings.isEnabled()) {
            return;
        }

        LocalDateTime lastRun = settings.getLastRunAt();
        int interval = Math.max(settings.getIntervalMinutes(), MIN_INTERVAL_MINUTES);
        if (lastRun != null && lastRun.plusMinutes(interval).isAfter(LocalDateTime.now())) {
            return;
        }

        runAutoPost("AUTO_AI_SCHEDULE", null, null, true);
    }

    private Map<String, Object> runAutoPost(String source, String topic, String eventKey, boolean enforceEnabled) {
        AutoPostSettings settings = loadOrCreateSettings();
        if (enforceEnabled && !settings.isEnabled()) {
            return Map.of("success", false, "message", "auto post is disabled");
        }

        User author = resolveAdminUser();
        if (author == null) {
            return Map.of("success", false, "message", "admin user not found");
        }

        log.info("[AutoPost] Starting production pipeline via {}", source);

        // 1. DISCOVERY
        List<Map<String, String>> candidates = discoverCandidates(settings, topic);
        if (candidates.isEmpty()) {
            return Map.of("success", false, "message", "No content discovered");
        }

        int saved = 0;
        int maxToPost = settings.getPostCountPerRun();
        
        for (Map<String, String> candidate : candidates) {
            if (saved >= maxToPost) break;

            String candidateUrl = candidate.get("link");
            String candidateTitle = candidate.get("title");

            // 2. DEDUPLICATION LAYER 1: URL
            if (candidateUrl != null && !candidateUrl.isEmpty() && newsArticleRepository.existsBySourceUrl(candidateUrl)) {
                log.debug("[AutoPost] Skipping (URL exists): {}", candidateTitle);
                continue;
            }

            // 3. REWRITE & ENRICH (via AI)
            Optional<Map<String, String>> generated = generateContentWithAi(settings, candidateTitle, candidate.get("content"), source);
            if (generated.isEmpty()) continue;

            Map<String, String> data = generated.get();
            String finalTitle = data.get("title");
            String finalContent = data.get("content");

            // 4. DEDUPLICATION LAYER 2: HASH
            String contentHash = sha256(finalTitle + finalContent);
            if (newsArticleRepository.existsByHash(contentHash)) {
                log.debug("[AutoPost] Skipping (Hash exists): {}", finalTitle);
                continue;
            }

            // 5. DEDUPLICATION LAYER 3: SEMANTIC SIMILARITY
            List<Double> embedding = getEmbeddingWithAi(finalTitle);
            if (isSemanticallyDuplicate(embedding)) {
                log.info("[AutoPost] Skipping (Semantic duplicate): {}", finalTitle);
                continue;
            }

            // 6. IMAGE DISCOVERY (Enhanced)
            String imageUrl = resolveImageUrl(data, finalTitle);

            // 7. SAVE POST
            NewsArticle article = new NewsArticle();
            article.setAuthorId(author.getId());
            article.setCategory("NEWS");
            article.setTitle(finalTitle);
            article.setContent(finalContent);
            article.setSourceUrl(candidateUrl);
            article.setHash(contentHash);
            article.setEmbedding(embedding);
            article.setLinkUrl(data.get("linkUrl") != null ? data.get("linkUrl") : candidateUrl);
            
            article.setMedia(List.of(Map.of("type", "image", "url", imageUrl)));
            article.setCreatedAt(LocalDateTime.now());
            article.setUpdatedAt(LocalDateTime.now());

            newsArticleRepository.save(article);
            saved++;
        }

        if (saved > 0 && !"MANUAL_ADMIN".equals(source)) {
            settings.setLastRunAt(LocalDateTime.now());
            settingsRepository.save(settings);
        }

        return Map.of("success", true, "savedCount", saved);
    }

    private List<Map<String, String>> discoverCandidates(AutoPostSettings settings, String manualTopic) {
        List<Map<String, String>> all = new java.util.ArrayList<>();
        
        // Strategy: 70% RSS, 20% Trends, 10% AI Topic
        // Call AI service to handle the heavy lifting of discovery
        Map<String, Object> packet = new HashMap<>();
        packet.put("sources", settings.getRssSources() != null ? settings.getRssSources() : List.of("https://vnexpress.net/rss/so-hoa.rss"));
        packet.put("strategy", manualTopic != null ? "MANUAL" : "MIXED");
        packet.put("topic", manualTopic);

        Map<String, Object> req = Map.of("id", UUID.randomUUID().toString(), "pattern", Map.of("cmd", "ai.discover-content"), "data", packet);
        Object response = rabbitTemplate.convertSendAndReceive("ai_queue", req);
        
        if (response instanceof Map<?, ?> res && res.get("response") instanceof Map<?, ?> payload) {
            Object itemsObj = payload.get("items");
            if (itemsObj instanceof List<?> items) {
                for (Object item : items) {
                    if (item instanceof Map<?, ?> m) {
                        Map<String, String> candidate = new HashMap<>();
                        candidate.put("title", String.valueOf(m.get("title")));
                        candidate.put("content", String.valueOf(m.get("content")));
                        candidate.put("link", String.valueOf(m.get("link")));
                        all.add(candidate);
                    }
                }
            }
        }
        
        return all;
    }

    private Optional<Map<String, String>> generateContentWithAi(AutoPostSettings settings, String title, String originalContent, String source) {
        Map<String, Object> context = new HashMap<>();
        context.put("topic", title);
        context.put("original", originalContent);
        context.put("source", source);
        context.put("angle", decideAngle());

        Map<String, Object> data = new HashMap<>();
        data.put("template", settings.getContentTemplate());
        data.put("locale", settings.getLocale());
        data.put("context", context);

        Map<String, Object> packet = Map.of("id", UUID.randomUUID().toString(), "pattern", Map.of("cmd", "ai.generate-news-post"), "data", data);
        Object response = rabbitTemplate.convertSendAndReceive("ai_queue", packet);
        return extractNewsBodyFromNestAiReply(response);
    }

    private List<Double> getEmbeddingWithAi(String text) {
        Map<String, Object> packet = Map.of("id", UUID.randomUUID().toString(), "pattern", Map.of("cmd", "ai.get-embeddings"), "data", Map.of("text", text));
        Object response = rabbitTemplate.convertSendAndReceive("ai_queue", packet);
        
        if (response instanceof Map<?, ?> res && res.get("response") instanceof Map<?, ?> payload) {
            Object vectorObj = payload.get("vector");
            if (vectorObj instanceof List<?> vector) {
                return vector.stream()
                        .filter(v -> v instanceof Number)
                        .map(v -> ((Number) v).doubleValue())
                        .toList();
            }
        }
        return List.of();
    }

    private boolean isSemanticallyDuplicate(List<Double> newVec) {
        if (newVec == null || newVec.isEmpty()) return false;
        
        // Compare with last 50 articles
        List<NewsArticle> recent = newsArticleRepository.findAll().stream()
                .filter(a -> a.getEmbedding() != null && !a.getEmbedding().isEmpty())
                .limit(50)
                .toList();

        for (NewsArticle article : recent) {
            double sim = cosineSimilarity(newVec, article.getEmbedding());
            if (sim > 0.85) return true;
        }
        return false;
    }

    private double cosineSimilarity(List<Double> vecA, List<Double> vecB) {
        if (vecA.size() != vecB.size() || vecA.isEmpty()) return 0;
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < vecA.size(); i++) {
            dotProduct += vecA.get(i) * vecB.get(i);
            normA += Math.pow(vecA.get(i), 2);
            normB += Math.pow(vecB.get(i), 2);
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private String resolveImageUrl(Map<String, String> aiData, String title) {
        String url = aiData.get("imageUrl");
        if (url != null && !url.isEmpty() && url.startsWith("http")) {
            log.info("[AutoPost] Using image from AI: {}", url);
            return url;
        }

        // Fallback: Search using keywords
        String keywords = aiData.get("imageKeywords");
        if (keywords == null || keywords.isEmpty()) keywords = title;

        log.info("[AutoPost] Searching for images with keywords: {}", keywords);
        Map<String, Object> packet = Map.of("id", UUID.randomUUID().toString(), "pattern", Map.of("cmd", "ai.search-images"), "data", Map.of("query", keywords));
        Object response = rabbitTemplate.convertSendAndReceive("ai_queue", packet);
        
        if (response instanceof Map<?, ?> res && res.get("response") instanceof Map<?, ?> payload) {
            Object urlsObj = payload.get("urls");
            if (urlsObj instanceof List<?> urls && !urls.isEmpty()) {
                String found = String.valueOf(urls.get(0));
                log.info("[AutoPost] Found image via search: {}", found);
                return found;
            }
        }

        String fallbackKeywords = (aiData.get("imageKeywords") != null && !aiData.get("imageKeywords").isEmpty()) 
                                   ? aiData.get("imageKeywords") : title;
        String fallback = "https://loremflickr.com/1200/800/" + fallbackKeywords.replaceAll("[^a-zA-Z0-9]+", ",");
        log.warn("[AutoPost] No image found, using fallback: {}", fallback);
        return fallback;
    }

    private String decideAngle() {
        String[] angles = {"hướng dẫn cho người mới", "phân tích chuyên sâu", "so sánh", "case study", "xu hướng 2026"};
        return angles[(int) (Math.random() * angles.length)];
    }

    private String sha256(String base) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(base.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception ex) {
            return UUID.randomUUID().toString();
        }
    }

    private Optional<Map<String, String>> extractNewsBodyFromNestAiReply(Object response) {
        log.info("[AutoPost] Raw AI Response from RabbitMQ: {}", response);
        
        if (!(response instanceof Map<?, ?> top)) {
            log.error("[AutoPost] Response is not a Map: {}", response != null ? response.getClass().getName() : "null");
            return Optional.empty();
        }
        
        Object payloadObj = top.get("response");
        if (payloadObj == null) payloadObj = top;
        
        if (!(payloadObj instanceof Map<?, ?> payload)) {
            log.error("[AutoPost] Payload is not a Map: {}", payloadObj != null ? payloadObj.getClass().getName() : "null");
            return Optional.empty();
        }
 
        if (Boolean.FALSE.equals(payload.get("success"))) {
            log.warn("[AutoPost] AI Service returned success=false: {}", payload.get("message"));
            return Optional.empty();
        }
 
        String title = payload.get("title") != null ? String.valueOf(payload.get("title")) : "Tin tức mới";
        String content = payload.get("content") != null ? String.valueOf(payload.get("content")) : "";
        
        log.debug("[AutoPost] Extracted Title: {}", title);
        log.debug("[AutoPost] Extracted Content Length: {}", content.length());
        
        if (content.length() < 100) {
            log.warn("[AutoPost] Content too short ({} chars), skipping", content.length());
            return Optional.empty();
        }
 
        Map<String, String> result = new HashMap<>();
        result.put("title", title);
        result.put("content", content);
        result.put("imageUrl", payload.get("imageUrl") != null ? String.valueOf(payload.get("imageUrl")) : "");
        result.put("linkUrl", payload.get("linkUrl") != null ? String.valueOf(payload.get("linkUrl")) : "");
        result.put("imageKeywords", payload.get("imageKeywords") != null ? String.valueOf(payload.get("imageKeywords")) : "");
        
        log.info("[AutoPost] Successfully extracted news article: {}", title);
        return Optional.of(result);
    }

    private AutoPostSettings loadOrCreateSettings() {
        Optional<AutoPostSettings> existing = settingsRepository.findAll().stream().findFirst();
        if (existing.isPresent()) return existing.get();

        AutoPostSettings defaults = new AutoPostSettings();
        defaults.setEnabled(false);
        defaults.setEventTriggerEnabled(true);
        defaults.setPostCountPerRun(1);
        defaults.setIntervalMinutes(DEFAULT_INTERVAL_MINUTES);
        defaults.setContentTemplate(DEFAULT_TEMPLATE);
        defaults.setLocale("vi");
        defaults.setRssSources(List.of(
            "https://vnexpress.net/rss/so-hoa.rss",
            "https://techcrunch.com/feed/",
            "https://thanhnien.vn/rss/cong-nghe-game-12.rss"
        ));
        defaults.setTopicTrackingDays(7);
        defaults.setCreatedAt(LocalDateTime.now());
        defaults.setUpdatedAt(LocalDateTime.now());
        return settingsRepository.save(defaults);
    }

    private User resolveAdminUser() {
        return userRepository.findAll().stream()
                .filter(user -> "ADMIN".equalsIgnoreCase(user.getRole()))
                .findFirst()
                .orElse(userRepository.findAll().stream().findFirst().orElse(null));
    }

    private int clampInt(Object value, int min, int max, int fallback) {
        try { return Math.max(min, Math.min(Integer.parseInt(String.valueOf(value)), max)); }
        catch (Exception ex) { return fallback; }
    }

    private String safeString(Object value) { return value == null ? null : String.valueOf(value); }
}
