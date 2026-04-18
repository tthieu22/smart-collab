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
        if (eventLogRepository.existsByEventKey(dedupKey)) {
            return;
        }

        Map<String, Object> result = runAutoPost("AUTO_AI_EVENT", "project " + projectId, dedupKey, true);
        if (Boolean.TRUE.equals(result.get("success"))) {
            AutoPostEventLog logItem = new AutoPostEventLog();
            logItem.setEventKey(dedupKey);
            logItem.setCreatedAt(LocalDateTime.now());
            eventLogRepository.save(logItem);
        }
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

        runAutoPost("AUTO_AI_SCHEDULE", "ban tin dinh ky", null, true);
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

        int postCount = Math.max(1, Math.min(settings.getPostCountPerRun(), MAX_POSTS_PER_RUN));
        int saved = 0;
        for (int i = 0; i < postCount; i++) {
            Optional<String> generated = generateContentWithAi(settings, topic, source, i + 1);
            if (generated.isEmpty()) {
                log.warn("Skipping news item {} — AI did not return content", i + 1);
                continue;
            }
            NewsArticle article = new NewsArticle();
            article.setAuthorId(author.getId());
            article.setCategory("NEWS");
            article.setContent(generated.get());
            article.setCreatedAt(LocalDateTime.now());
            article.setUpdatedAt(LocalDateTime.now());
            newsArticleRepository.save(article);
            saved++;
        }

        if (saved == 0) {
            return Map.of(
                    "success", false,
                    "message", "AI did not generate any article (check project service / LLM and RabbitMQ ai_queue)",
                    "source", source
            );
        }

        if (!"MANUAL_ADMIN".equals(source)) {
            settings.setLastRunAt(LocalDateTime.now());
            settings.setUpdatedAt(LocalDateTime.now());
            settingsRepository.save(settings);
        }

        return Map.of(
                "success", true,
                "source", source,
                "postCount", saved,
                "eventKey", eventKey == null ? "" : eventKey
        );
    }

    private Optional<String> generateContentWithAi(AutoPostSettings settings, String topic, String source, int index) {
        try {
            Map<String, Object> pattern = Map.of("cmd", "ai.generate-news-post");
            Map<String, Object> context = new HashMap<>();
            context.put("topic", topic);
            context.put("source", source);
            context.put("index", index);
            context.put("timestamp", LocalDateTime.now().toString());

            Map<String, Object> data = new HashMap<>();
            data.put("template", settings.getContentTemplate());
            data.put("locale", settings.getLocale());
            data.put("context", context);

            Map<String, Object> packet = new HashMap<>();
            packet.put("id", UUID.randomUUID().toString());
            packet.put("pattern", pattern);
            packet.put("data", data);

            Object response = rabbitTemplate.convertSendAndReceive("ai_queue", packet);
            return extractNewsBodyFromNestAiReply(response);
        } catch (Exception ex) {
            log.warn("AI generation failed (no template fallback)", ex);
        }

        return Optional.empty();
    }

    /**
     * NestJS RMQ microservice wraps handler return value as
     * {@code { id, err, response: { success, content, ... } }}.
     * Plain maps without {@code response} are still supported.
     */
    private Optional<String> extractNewsBodyFromNestAiReply(Object response) {
        if (response == null) {
            log.warn("AI RPC reply is null (timeout or no consumer?)");
            return Optional.empty();
        }
        if (!(response instanceof Map<?, ?> top)) {
            log.warn("AI RPC reply is not a map: {}", response.getClass().getName());
            return Optional.empty();
        }

        Object err = top.get("err");
        if (err != null && !String.valueOf(err).isBlank() && !"null".equals(String.valueOf(err))) {
            log.warn("Nest RPC err: {}", err);
            return Optional.empty();
        }

        Object payloadObj = top.get("response");
        if (payloadObj == null) {
            payloadObj = top;
        }

        if (!(payloadObj instanceof Map<?, ?> payload)) {
            log.warn("AI payload is not a map. Top-level keys: {}", top.keySet());
            return Optional.empty();
        }

        Object success = payload.get("success");
        if (Boolean.FALSE.equals(success)) {
            log.warn("AI service reported failure: {}", payload.get("message"));
            return Optional.empty();
        }

        Object content = payload.get("content");
        if (content != null) {
            String body = String.valueOf(content).trim();
            if (!body.isEmpty()) {
                return Optional.of(body);
            }
        }

        Object nestedData = payload.get("data");
        if (nestedData instanceof Map<?, ?> nested && nested.get("content") != null) {
            String body = String.valueOf(nested.get("content")).trim();
            if (!body.isEmpty()) {
                return Optional.of(body);
            }
        }

        log.warn("AI RPC map had no usable content. Keys (top): {} payload keys: {}", top.keySet(), payload.keySet());
        return Optional.empty();
    }

    private AutoPostSettings loadOrCreateSettings() {
        Optional<AutoPostSettings> existing = settingsRepository.findAll().stream().findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }

        AutoPostSettings defaults = new AutoPostSettings();
        defaults.setEnabled(false);
        defaults.setEventTriggerEnabled(true);
        defaults.setPostCountPerRun(1);
        defaults.setIntervalMinutes(DEFAULT_INTERVAL_MINUTES);
        defaults.setContentTemplate(DEFAULT_TEMPLATE);
        defaults.setLocale("vi");
        defaults.setCreatedAt(LocalDateTime.now());
        defaults.setUpdatedAt(LocalDateTime.now());
        return settingsRepository.save(defaults);
    }

    private User resolveAdminUser() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .filter(user -> "ADMIN".equalsIgnoreCase(user.getRole()))
                .findFirst()
                .orElse(users.stream().findFirst().orElse(null));
    }

    private int clampInt(Object value, int min, int max, int fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            int parsed = Integer.parseInt(String.valueOf(value));
            return Math.max(min, Math.min(parsed, max));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private String safeString(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
