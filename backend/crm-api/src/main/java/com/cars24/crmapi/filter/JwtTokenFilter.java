package com.cars24.crmapi.filter;

import com.cars24.crmapi.auth.ActorContext;
import com.cars24.crmapi.auth.ActorScope;
import com.cars24.crmapi.auth.AuthMetadata;
import com.cars24.crmapi.auth.AuthResponseWriter;
import com.cars24.crmapi.auth.CrmRequestContextHolder;
import com.cars24.crmapi.auth.RequestContext;
import com.cars24.crmapi.config.JwtConfig;
import com.cars24.crmapi.util.JwtReader;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class JwtTokenFilter extends OncePerRequestFilter {

    private final JwtReader jwtReader;
    private final JwtConfig jwtConfig;
    private final AuthResponseWriter authResponseWriter;

    public JwtTokenFilter(JwtReader jwtReader, JwtConfig jwtConfig, AuthResponseWriter authResponseWriter) {
        this.jwtReader = jwtReader;
        this.jwtConfig = jwtConfig;
        this.authResponseWriter = authResponseWriter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            RequestContext requestContext = resolveRequestContext(request, response);
            if (requestContext == null && response.isCommitted()) {
                return;
            }

            if (requestContext != null) {
                request.setAttribute(CrmRequestContextHolder.REQUEST_CONTEXT_ATTRIBUTE, requestContext);
                CrmRequestContextHolder.set(requestContext);
                enrichMdc(requestContext);
            }

            filterChain.doFilter(request, response);
        } finally {
            request.removeAttribute(CrmRequestContextHolder.REQUEST_CONTEXT_ATTRIBUTE);
            CrmRequestContextHolder.clear();
        }
    }

    private RequestContext resolveRequestContext(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return resolveJwtRequestContext(request, response, authorizationHeader.substring(7));
        }

        if (jwtConfig.isDevHeaderFallbackEnabled()) {
            return resolveDevHeaderContext(request, response);
        }

        return null;
    }

    private RequestContext resolveJwtRequestContext(HttpServletRequest request,
                                                    HttpServletResponse response,
                                                    String token) throws IOException {
        try {
            Claims claims = jwtReader.parseJwtToken(token);
            ActorContext authenticatedActor = buildAuthenticatedActor(claims);
            ActorContext effectiveActor = buildEffectiveActor(claims, authenticatedActor);
            ActorScope actorScope = determineScope(authenticatedActor, effectiveActor);

            return RequestContext.builder()
                    .authenticated(true)
                    .authenticatedActor(authenticatedActor)
                    .effectiveActor(effectiveActor)
                    .actorScope(actorScope)
                    .metadata(buildJwtMetadata(request, claims))
                    .build();
        } catch (ExpiredJwtException exception) {
            authResponseWriter.writeUnauthorized(request, response, "JWT token has expired");
            return null;
        } catch (JwtException | IllegalArgumentException exception) {
            authResponseWriter.writeUnauthorized(request, response, "Invalid JWT token");
            return null;
        }
    }

    private RequestContext resolveDevHeaderContext(HttpServletRequest request,
                                                   HttpServletResponse response) throws IOException {
        String userId = header(request, "X-User-Id");
        String userRole = header(request, "X-User-Role");

        if (userId == null && userRole == null) {
            return null;
        }

        if (isBlank(userId) || isBlank(userRole)) {
            authResponseWriter.writeUnauthorized(request, response,
                    "Dev auth requires X-User-Id and X-User-Role headers");
            return null;
        }

        ActorContext authenticatedActor = ActorContext.builder()
                .userId(userId)
                .roles(List.of(userRole))
                .permissions(parseCsvHeader(header(request, "X-Permissions")))
                .tenantGroup(header(request, "X-Team-Id"))
                .build();

        String impersonatedUserId = header(request, "X-Impersonate-User-Id");
        ActorContext effectiveActor = authenticatedActor;
        ActorScope actorScope = determineScopeFromRoles(authenticatedActor.getRoles());

        if (!isBlank(impersonatedUserId)) {
            if (!authenticatedActor.getRoles().contains("ADMIN")) {
                authResponseWriter.writeUnauthorized(request, response,
                        "Only ADMIN can use dev impersonation headers");
                return null;
            }

            effectiveActor = ActorContext.builder()
                    .userId(impersonatedUserId)
                    .roles(parseCsvHeaderWithFallback(header(request, "X-Impersonate-User-Role"),
                            authenticatedActor.getRoles()))
                    .permissions(parseCsvHeaderWithFallback(header(request, "X-Impersonate-Permissions"),
                            authenticatedActor.getPermissions()))
                    .tenantGroup(defaultString(header(request, "X-Impersonate-Team-Id"),
                            authenticatedActor.getTenantGroup()))
                    .build();
            actorScope = ActorScope.IMPERSONATED;
        }

        Map<String, Object> rawHeaders = new LinkedHashMap<>();
        rawHeaders.put("xUserId", userId);
        rawHeaders.put("xUserRole", userRole);
        rawHeaders.put("xTeamId", header(request, "X-Team-Id"));
        rawHeaders.put("xPermissions", header(request, "X-Permissions"));
        rawHeaders.put("xImpersonateUserId", impersonatedUserId);
        rawHeaders.put("xImpersonateUserRole", header(request, "X-Impersonate-User-Role"));

        return RequestContext.builder()
                .authenticated(true)
                .authenticatedActor(authenticatedActor)
                .effectiveActor(effectiveActor)
                .actorScope(actorScope)
                .metadata(AuthMetadata.builder()
                        .authSource("dev-headers")
                        .requestId((String) request.getAttribute(CrmRequestContextHolder.REQUEST_ID_ATTRIBUTE))
                        .rawAuthMetadata(rawHeaders)
                        .build())
                .build();
    }

    private ActorContext buildAuthenticatedActor(Claims claims) {
        String userId = stringClaim(claims, "user_id");
        if (isBlank(userId)) {
            throw new IllegalArgumentException("JWT token is missing user_id");
        }

        return ActorContext.builder()
                .userId(userId)
                .roles(extractRoles(claims, "roles", "role"))
                .permissions(extractStringList(claims.get("permissions")))
                .tenantGroup(defaultString(stringClaim(claims, "tenant_group"), stringClaim(claims, "team_id")))
                .build();
    }

    private ActorContext buildEffectiveActor(Claims claims, ActorContext authenticatedActor) {
        String effectiveUserId = stringClaim(claims, "effective_user_id");
        if (isBlank(effectiveUserId)) {
            return authenticatedActor;
        }

        if (!Objects.equals(authenticatedActor.getUserId(), effectiveUserId)
                && !authenticatedActor.getRoles().contains("ADMIN")) {
            throw new IllegalArgumentException("Only ADMIN can impersonate another user via JWT");
        }

        return ActorContext.builder()
                .userId(effectiveUserId)
                .roles(extractRoles(claims, "effective_roles", "effective_role"))
                .permissions(extractStringList(claims.get("effective_permissions")))
                .tenantGroup(defaultString(stringClaim(claims, "effective_tenant_group"),
                        defaultString(stringClaim(claims, "effective_team_id"), authenticatedActor.getTenantGroup())))
                .build();
    }

    private ActorScope determineScope(ActorContext authenticatedActor, ActorContext effectiveActor) {
        if (!Objects.equals(authenticatedActor.getUserId(), effectiveActor.getUserId())) {
            return ActorScope.IMPERSONATED;
        }
        return determineScopeFromRoles(effectiveActor.getRoles());
    }

    private ActorScope determineScopeFromRoles(List<String> roles) {
        if (roles.contains("ADMIN")) {
            return ActorScope.GLOBAL;
        }
        if (roles.contains("TL")) {
            return ActorScope.TEAM;
        }
        return ActorScope.SELF;
    }

    private AuthMetadata buildJwtMetadata(HttpServletRequest request, Claims claims) {
        Map<String, Object> rawClaims = new LinkedHashMap<>(claims);
        return AuthMetadata.builder()
                .authSource("jwt")
                .tokenSubject(claims.getSubject())
                .issuer(claims.getIssuer())
                .expiresAt(claims.getExpiration() == null ? null : claims.getExpiration().toInstant())
                .requestId((String) request.getAttribute(CrmRequestContextHolder.REQUEST_ID_ATTRIBUTE))
                .rawAuthMetadata(rawClaims)
                .build();
    }

    private List<String> extractRoles(Claims claims, String pluralClaim, String singularClaim) {
        List<String> roles = extractStringList(claims.get(pluralClaim));
        if (!roles.isEmpty()) {
            return roles;
        }
        String role = stringClaim(claims, singularClaim);
        if (isBlank(role)) {
            return Collections.emptyList();
        }
        return List.of(role);
    }

    private List<String> extractStringList(Object value) {
        if (value == null) {
            return Collections.emptyList();
        }
        if (value instanceof List<?>) {
            return ((List<?>) value).stream()
                    .filter(Objects::nonNull)
                    .map(String::valueOf)
                    .filter(s -> !s.isBlank())
                    .toList();
        }
        if (value instanceof String) {
            return Arrays.stream(((String) value).split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        return List.of(String.valueOf(value));
    }

    private List<String> parseCsvHeader(String headerValue) {
        if (isBlank(headerValue)) {
            return Collections.emptyList();
        }
        return Arrays.stream(headerValue.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private List<String> parseCsvHeaderWithFallback(String headerValue, List<String> fallback) {
        List<String> parsed = parseCsvHeader(headerValue);
        return parsed.isEmpty() ? fallback : parsed;
    }

    private String stringClaim(Claims claims, String claimName) {
        Object value = claims.get(claimName);
        return value == null ? null : String.valueOf(value);
    }

    private String header(HttpServletRequest request, String headerName) {
        return request.getHeader(headerName);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String defaultString(String value, String fallback) {
        return isBlank(value) ? fallback : value;
    }

    private void enrichMdc(RequestContext ctx) {
        ActorContext actor = ctx.getEffectiveActor();
        if (actor != null) {
            MDC.put("userId", actor.getUserId());
            if (actor.getRoles() != null && !actor.getRoles().isEmpty()) {
                MDC.put("role", actor.getRoles().get(0));
            }
        }
        if (ctx.getActorScope() != null) {
            MDC.put("scope", ctx.getActorScope().name());
        }
    }
}
