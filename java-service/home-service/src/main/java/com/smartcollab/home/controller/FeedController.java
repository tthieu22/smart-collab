package com.smartcollab.home.controller;

import com.smartcollab.home.dto.FeedResponseDTO;
import com.smartcollab.home.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/feed")
@RequiredArgsConstructor
public class FeedController {
    private final FeedService feedService;

    @GetMapping
    public FeedResponseDTO getFeed(@RequestHeader(value = "X-User-Id", defaultValue = "u_me") String userId) {
        return feedService.getFeed(userId);
    }
}
