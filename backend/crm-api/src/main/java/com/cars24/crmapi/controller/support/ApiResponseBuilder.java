package com.cars24.crmapi.controller.support;

import com.cars24.crmapi.auth.CrmRequestContextHolder;
import com.cars24.crmapi.auth.RequestContext;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.common.ApiResponseMeta;
import com.cars24.crmapi.dto.common.PaginationMeta;
import com.cars24.crmcore.dto.PaginatedResponse;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Builds standard API response envelopes for controllers.
 * Extracts requestId and role from the current request context.
 * Handles 0-based (Spring) to 1-based (legacy API) page number conversion.
 */
@Component
public class ApiResponseBuilder {

    public <T> ApiResponseEnvelope<T> ok(T data) {
        return buildEnvelope(data, null, null);
    }

    public <T> ApiResponseEnvelope<T> ok(T data, String timeScope) {
        return buildEnvelope(data, timeScope, null);
    }

    public <T> ApiResponseEnvelope<List<T>> okPaginated(PaginatedResponse<T> page) {
        return buildPaginatedEnvelope(page, null);
    }

    public <T> ApiResponseEnvelope<List<T>> okPaginated(PaginatedResponse<T> page, String timeScope) {
        return buildPaginatedEnvelope(page, timeScope);
    }

    private <T> ApiResponseEnvelope<T> buildEnvelope(T data, String timeScope, PaginationMeta pagination) {
        ApiResponseMeta meta = ApiResponseMeta.builder()
                .timestamp(Instant.now().toString())
                .requestId(resolveRequestId())
                .role(resolveRole())
                .timeScope(timeScope)
                .pagination(pagination)
                .build();

        return ApiResponseEnvelope.<T>builder()
                .success(true)
                .data(data)
                .meta(meta)
                .error(null)
                .build();
    }

    private <T> ApiResponseEnvelope<List<T>> buildPaginatedEnvelope(PaginatedResponse<T> page, String timeScope) {
        // Convert 0-based (Spring/PaginatedResponse) to 1-based (legacy API contract)
        int oneBasedPage = page.getPage() + 1;

        PaginationMeta pagination = PaginationMeta.builder()
                .page(oneBasedPage)
                .pageSize(page.getPageSize())
                .totalItems(page.getTotalItems())
                .totalPages(page.getTotalPages())
                .hasNext(oneBasedPage < page.getTotalPages())
                .build();

        ApiResponseMeta meta = ApiResponseMeta.builder()
                .timestamp(Instant.now().toString())
                .requestId(resolveRequestId())
                .role(resolveRole())
                .timeScope(timeScope)
                .pagination(pagination)
                .build();

        return ApiResponseEnvelope.<List<T>>builder()
                .success(true)
                .data(page.getItems())
                .meta(meta)
                .error(null)
                .build();
    }

    private String resolveRequestId() {
        RequestContext ctx = CrmRequestContextHolder.get();
        if (ctx != null && ctx.getMetadata() != null && ctx.getMetadata().getRequestId() != null) {
            return ctx.getMetadata().getRequestId();
        }
        return "req-" + UUID.randomUUID();
    }

    private String resolveRole() {
        RequestContext ctx = CrmRequestContextHolder.get();
        if (ctx != null && ctx.getEffectiveActor() != null
                && ctx.getEffectiveActor().getRoles() != null
                && !ctx.getEffectiveActor().getRoles().isEmpty()) {
            return ctx.getEffectiveActor().getRoles().get(0);
        }
        return null;
    }
}
