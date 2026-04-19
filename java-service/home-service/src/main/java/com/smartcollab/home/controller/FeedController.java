package com.smartcollab.home.controller;

import com.smartcollab.home.dto.FeedResponseDTO;
import com.smartcollab.home.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/feed")
@RequiredArgsConstructor
public class FeedController {
    private final FeedService feedService;

    @GetMapping
    public FeedResponseDTO getFeed(
            @RequestHeader(value = "X-User-Id", defaultValue = "u_me") String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) List<String> excludeIds
    ) {
        return feedService.getFeed(userId, page, limit, excludeIds != null ? excludeIds : Collections.emptyList());
    }
}
