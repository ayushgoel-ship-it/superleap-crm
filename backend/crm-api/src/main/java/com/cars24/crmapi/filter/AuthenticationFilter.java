package com.cars24.crmapi.filter;

import com.cars24.crmapi.auth.AuthResponseWriter;
import com.cars24.crmapi.auth.CrmRequestContextHolder;
import com.cars24.crmapi.auth.RequestContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AuthenticationFilter extends OncePerRequestFilter {

    private final AuthResponseWriter authResponseWriter;

    public AuthenticationFilter(AuthResponseWriter authResponseWriter) {
        this.authResponseWriter = authResponseWriter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        RequestContext requestContext = CrmRequestContextHolder.getFromRequest(request);
        if (requestContext == null || !requestContext.isAuthenticated()) {
            authResponseWriter.writeUnauthorized(request, response, "Missing or invalid authentication credentials");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
