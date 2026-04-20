package com.cars24.crmapi.exception;

import com.cars24.crmapi.auth.CrmRequestContextHolder;
import com.cars24.crmapi.dto.common.ApiErrorBody;
import com.cars24.crmapi.dto.common.ApiErrorEnvelope;
import com.cars24.crmapi.dto.common.ApiMeta;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

@Component
public class ApiErrorResponseFactory {

    private static final String GENERIC_INTERNAL_MESSAGE = "An unexpected error occurred";
    private static final String GENERIC_EXTERNAL_DEPENDENCY_MESSAGE = "Upstream dependency failure";

    private final Environment environment;
    private final ObjectMapper objectMapper;

    public ApiErrorResponseFactory(Environment environment, ObjectMapper objectMapper) {
        this.environment = environment;
        this.objectMapper = objectMapper;
    }

    public ResponseEntity<ApiErrorEnvelope> buildResponse(HttpServletRequest request,
                                                          HttpStatus status,
                                                          String code,
                                                          String message) {
        return buildResponse(request, status, code, message, defaultProductionSafeMessage(status));
    }

    public ResponseEntity<ApiErrorEnvelope> buildResponse(HttpServletRequest request,
                                                          HttpStatus status,
                                                          String code,
                                                          String message,
                                                          String productionSafeMessage) {
        ApiErrorEnvelope envelope = createEnvelope(request, code, resolveMessage(status, message, productionSafeMessage));
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(envelope);
    }

    public void writeResponse(HttpServletRequest request,
                              HttpServletResponse response,
                              HttpStatus status,
                              String code,
                              String message) throws IOException {
        writeResponse(request, response, status, code, message, defaultProductionSafeMessage(status));
    }

    public void writeResponse(HttpServletRequest request,
                              HttpServletResponse response,
                              HttpStatus status,
                              String code,
                              String message,
                              String productionSafeMessage) throws IOException {
        ApiErrorEnvelope envelope = createEnvelope(request, code, resolveMessage(status, message, productionSafeMessage));
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), envelope);
        response.flushBuffer();
    }

    public String getRequestId(HttpServletRequest request) {
        Object requestId = request.getAttribute(CrmRequestContextHolder.REQUEST_ID_ATTRIBUTE);
        if (requestId instanceof String && !((String) requestId).isBlank()) {
            return (String) requestId;
        }
        return "req-" + UUID.randomUUID();
    }

    private ApiErrorEnvelope createEnvelope(HttpServletRequest request, String code, String message) {
        return ApiErrorEnvelope.builder()
                .success(false)
                .data(null)
                .meta(ApiMeta.builder()
                        .timestamp(Instant.now().toString())
                        .requestId(getRequestId(request))
                        .build())
                .error(ApiErrorBody.builder()
                        .code(code)
                        .message(message)
                        .build())
                .build();
    }

    private String resolveMessage(HttpStatus status, String message, String productionSafeMessage) {
        if (status.is5xxServerError() && isProdLike()) {
            return productionSafeMessage;
        }
        return message == null || message.isBlank() ? productionSafeMessage : message;
    }

    private String defaultProductionSafeMessage(HttpStatus status) {
        if (status == HttpStatus.BAD_GATEWAY || status == HttpStatus.GATEWAY_TIMEOUT) {
            return GENERIC_EXTERNAL_DEPENDENCY_MESSAGE;
        }
        return GENERIC_INTERNAL_MESSAGE;
    }

    private boolean isProdLike() {
        return environment.acceptsProfiles(Profiles.of("stage", "prod"));
    }
}
