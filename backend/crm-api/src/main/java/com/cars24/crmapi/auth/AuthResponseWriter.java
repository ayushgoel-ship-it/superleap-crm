package com.cars24.crmapi.auth;

import com.cars24.crmapi.exception.ApiErrorResponseFactory;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class AuthResponseWriter {

    private final ApiErrorResponseFactory apiErrorResponseFactory;

    public AuthResponseWriter(ApiErrorResponseFactory apiErrorResponseFactory) {
        this.apiErrorResponseFactory = apiErrorResponseFactory;
    }

    public void writeUnauthorized(HttpServletRequest request, HttpServletResponse response, String message)
            throws IOException {
        apiErrorResponseFactory.writeResponse(request, response, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
    }
}
