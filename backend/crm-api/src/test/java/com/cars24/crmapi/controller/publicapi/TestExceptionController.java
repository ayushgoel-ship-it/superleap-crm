package com.cars24.crmapi.controller.publicapi;

import com.cars24.crmapi.exception.UnauthorizedException;
import com.cars24.crmcore.exception.ExternalDependencyException;
import com.cars24.crmcore.exception.ForbiddenException;
import com.cars24.crmcore.exception.InvalidRequestException;
import com.cars24.crmcore.exception.OptimisticConflictException;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/public/test/errors")
class TestExceptionController {

    @GetMapping("/invalid-request")
    String invalidRequest() {
        throw new InvalidRequestException("Invalid request payload");
    }

    @GetMapping("/validation")
    String validation(@RequestParam @Min(1) int count) {
        return String.valueOf(count);
    }

    @GetMapping("/missing-header")
    String missingHeader(@RequestHeader("X-Test-Header") String ignored) {
        return ignored;
    }

    @GetMapping("/unauthorized")
    String unauthorized() {
        throw new UnauthorizedException("Token missing");
    }

    @GetMapping("/forbidden")
    String forbidden() {
        throw new ForbiddenException("Forbidden access");
    }

    @GetMapping("/not-found")
    String notFound() {
        throw new ResourceNotFoundException("Dealer not found");
    }

    @GetMapping("/conflict")
    String conflict() {
        throw new OptimisticConflictException("Update conflict");
    }

    @GetMapping("/external")
    String external() {
        throw new ExternalDependencyException("Partner service timed out");
    }

    @GetMapping("/internal")
    String internal() {
        throw new IllegalStateException("Internal state exploded");
    }
}
