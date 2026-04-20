package com.cars24.crmapi.controller.publicapi;

import com.cars24.crmcore.service.internal.HealthQueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final HealthQueryService healthQueryService;

    public HealthController(HealthQueryService healthQueryService) {
        this.healthQueryService = healthQueryService;
    }

    @GetMapping(value = "/public/health", produces = "text/plain")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok(healthQueryService.getHealthStatus());
    }
}
