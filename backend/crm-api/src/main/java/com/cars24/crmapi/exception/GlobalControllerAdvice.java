package com.cars24.crmapi.exception;

import com.cars24.crmapi.dto.common.ApiErrorEnvelope;
import com.cars24.crmcore.exception.ExternalDependencyException;
import com.cars24.crmcore.exception.ForbiddenException;
import com.cars24.crmcore.exception.IllegalStateTransitionException;
import com.cars24.crmcore.exception.InvalidRequestException;
import com.cars24.crmcore.exception.OptimisticConflictException;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalControllerAdvice {

    private final ApiErrorResponseFactory apiErrorResponseFactory;

    public GlobalControllerAdvice(ApiErrorResponseFactory apiErrorResponseFactory) {
        this.apiErrorResponseFactory = apiErrorResponseFactory;
    }

    @ExceptionHandler({
            InvalidRequestException.class,
            IllegalArgumentException.class,
            MethodArgumentNotValidException.class,
            BindException.class,
            ConstraintViolationException.class,
            MethodArgumentTypeMismatchException.class,
            MissingRequestHeaderException.class,
            MissingServletRequestParameterException.class,
            HttpMessageNotReadableException.class,
            HttpRequestMethodNotSupportedException.class
    })
    public ResponseEntity<ApiErrorEnvelope> handleInvalidRequest(Exception exception, HttpServletRequest request) {
        return buildWarningResponse(request, HttpStatus.BAD_REQUEST, "INVALID_REQUEST", exception.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiErrorEnvelope> handleUnauthorized(UnauthorizedException exception, HttpServletRequest request) {
        return buildWarningResponse(request, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", exception.getMessage());
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiErrorEnvelope> handleForbidden(ForbiddenException exception, HttpServletRequest request) {
        return buildWarningResponse(request, HttpStatus.FORBIDDEN, "FORBIDDEN", exception.getMessage());
    }

    @ExceptionHandler({ResourceNotFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ApiErrorEnvelope> handleNotFound(Exception exception, HttpServletRequest request) {
        return buildWarningResponse(request, HttpStatus.NOT_FOUND, "NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(OptimisticConflictException.class)
    public ResponseEntity<ApiErrorEnvelope> handleOptimisticConflict(Exception exception, HttpServletRequest request) {
        return buildWarningResponse(request, HttpStatus.CONFLICT, "OPTIMISTIC_CONFLICT", exception.getMessage());
    }

    @ExceptionHandler(IllegalStateTransitionException.class)
    public ResponseEntity<ApiErrorEnvelope> handleIllegalStateTransition(Exception exception, HttpServletRequest request) {
        return buildWarningResponse(request, HttpStatus.CONFLICT, "ILLEGAL_STATE_TRANSITION", exception.getMessage());
    }

    @ExceptionHandler({ExternalDependencyException.class, RestClientException.class})
    public ResponseEntity<ApiErrorEnvelope> handleExternalDependency(Exception exception, HttpServletRequest request) {
        return buildErrorResponse(request,
                HttpStatus.BAD_GATEWAY,
                "EXTERNAL_DEPENDENCY_FAILURE",
                exception.getMessage(),
                "Upstream dependency failure",
                exception);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorEnvelope> handleUnexpected(Exception exception, HttpServletRequest request) {
        return buildErrorResponse(request,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                exception.getMessage(),
                "An unexpected error occurred",
                exception);
    }

    private ResponseEntity<ApiErrorEnvelope> buildWarningResponse(HttpServletRequest request,
                                                                  HttpStatus status,
                                                                  String code,
                                                                  String message) {
        String requestId = apiErrorResponseFactory.getRequestId(request);
        log.warn("Request failed. request_id={}, path={}, status={}, code={}, message={}",
                requestId, request.getRequestURI(), status.value(), code, message);
        return apiErrorResponseFactory.buildResponse(request, status, code, message);
    }

    private ResponseEntity<ApiErrorEnvelope> buildErrorResponse(HttpServletRequest request,
                                                                HttpStatus status,
                                                                String code,
                                                                String message,
                                                                String productionSafeMessage,
                                                                Exception exception) {
        String requestId = apiErrorResponseFactory.getRequestId(request);
        log.error("Request failed. request_id={}, path={}, status={}, code={}, message={}",
                requestId, request.getRequestURI(), status.value(), code, message, exception);
        return apiErrorResponseFactory.buildResponse(request, status, code, message, productionSafeMessage);
    }
}
