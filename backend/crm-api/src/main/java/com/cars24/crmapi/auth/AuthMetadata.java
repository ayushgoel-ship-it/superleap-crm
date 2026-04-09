package com.cars24.crmapi.auth;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.Map;

@Value
@Builder
public class AuthMetadata {

    String authSource;
    String tokenSubject;
    String issuer;
    Instant expiresAt;
    String requestId;
    Map<String, Object> rawAuthMetadata;
}
