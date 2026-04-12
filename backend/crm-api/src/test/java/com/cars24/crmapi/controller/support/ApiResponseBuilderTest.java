package com.cars24.crmapi.controller.support;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.common.PaginationMeta;
import com.cars24.crmcore.dto.PaginatedResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ApiResponseBuilderTest {

    private final ApiResponseBuilder builder = new ApiResponseBuilder();

    @BeforeEach
    void setUp() {
        RequestContext ctx = RequestContext.builder()
                .authenticated(true)
                .effectiveActor(ActorContext.builder()
                        .userId("user-123")
                        .roles(List.of("KAM"))
                        .permissions(List.of("read:dealers"))
                        .tenantGroup("cars24")
                        .build())
                .actorScope(ActorScope.SELF)
                .metadata(AuthMetadata.builder()
                        .requestId("req-test-001")
                        .build())
                .build();
        CrmRequestContextHolder.set(ctx);
    }

    @AfterEach
    void tearDown() {
        CrmRequestContextHolder.clear();
    }

    @Test
    void ok_wrapsDataInSuccessEnvelope() {
        ApiResponseEnvelope<String> envelope = builder.ok("hello");

        assertThat(envelope.isSuccess()).isTrue();
        assertThat(envelope.getData()).isEqualTo("hello");
        assertThat(envelope.getError()).isNull();
        assertThat(envelope.getMeta()).isNotNull();
        assertThat(envelope.getMeta().getRequestId()).isEqualTo("req-test-001");
        assertThat(envelope.getMeta().getRole()).isEqualTo("KAM");
        assertThat(envelope.getMeta().getTimeScope()).isNull();
        assertThat(envelope.getMeta().getPagination()).isNull();
    }

    @Test
    void ok_withTimeScope_setsTimeScopeInMeta() {
        ApiResponseEnvelope<String> envelope = builder.ok("data", "mtd");

        assertThat(envelope.getMeta().getTimeScope()).isEqualTo("mtd");
    }

    @Test
    void ok_generatesRequestId_whenContextMissing() {
        CrmRequestContextHolder.clear();

        ApiResponseEnvelope<String> envelope = builder.ok("data");

        assertThat(envelope.getMeta().getRequestId()).startsWith("req-");
        assertThat(envelope.getMeta().getRole()).isNull();
    }

    @Test
    void okPaginated_convertsZeroBasedToOneBased() {
        PaginatedResponse<String> page = PaginatedResponse.<String>builder()
                .items(List.of("a", "b"))
                .page(0) // 0-based (Spring internal)
                .pageSize(10)
                .totalItems(25)
                .totalPages(3)
                .build();

        ApiResponseEnvelope<List<String>> envelope = builder.okPaginated(page);

        assertThat(envelope.isSuccess()).isTrue();
        assertThat(envelope.getData()).containsExactly("a", "b");

        PaginationMeta pagination = envelope.getMeta().getPagination();
        assertThat(pagination).isNotNull();
        assertThat(pagination.getPage()).isEqualTo(1); // 0-based → 1-based
        assertThat(pagination.getPageSize()).isEqualTo(10);
        assertThat(pagination.getTotalItems()).isEqualTo(25);
        assertThat(pagination.getTotalPages()).isEqualTo(3);
        assertThat(pagination.isHasNext()).isTrue(); // page 1 < 3 total pages
    }

    @Test
    void okPaginated_hasNext_falseOnLastPage() {
        PaginatedResponse<String> page = PaginatedResponse.<String>builder()
                .items(List.of("z"))
                .page(2) // 0-based page 2 → 1-based page 3
                .pageSize(10)
                .totalItems(25)
                .totalPages(3)
                .build();

        ApiResponseEnvelope<List<String>> envelope = builder.okPaginated(page);
        PaginationMeta pagination = envelope.getMeta().getPagination();

        assertThat(pagination.getPage()).isEqualTo(3);
        assertThat(pagination.isHasNext()).isFalse(); // page 3 == 3 total pages
    }

    @Test
    void okPaginated_hasNext_trueOnMiddlePage() {
        PaginatedResponse<String> page = PaginatedResponse.<String>builder()
                .items(List.of("m"))
                .page(1) // 0-based page 1 → 1-based page 2
                .pageSize(10)
                .totalItems(30)
                .totalPages(3)
                .build();

        ApiResponseEnvelope<List<String>> envelope = builder.okPaginated(page);
        PaginationMeta pagination = envelope.getMeta().getPagination();

        assertThat(pagination.getPage()).isEqualTo(2);
        assertThat(pagination.isHasNext()).isTrue();
    }

    @Test
    void okPaginated_withTimeScope() {
        PaginatedResponse<String> page = PaginatedResponse.<String>builder()
                .items(List.of())
                .page(0)
                .pageSize(20)
                .totalItems(0)
                .totalPages(0)
                .build();

        ApiResponseEnvelope<List<String>> envelope = builder.okPaginated(page, "wtd");

        assertThat(envelope.getMeta().getTimeScope()).isEqualTo("wtd");
    }

    @Test
    void okPaginated_emptyPage() {
        PaginatedResponse<String> page = PaginatedResponse.<String>builder()
                .items(List.of())
                .page(0)
                .pageSize(20)
                .totalItems(0)
                .totalPages(0)
                .build();

        ApiResponseEnvelope<List<String>> envelope = builder.okPaginated(page);
        PaginationMeta pagination = envelope.getMeta().getPagination();

        assertThat(envelope.getData()).isEmpty();
        assertThat(pagination.getPage()).isEqualTo(1);
        assertThat(pagination.getTotalItems()).isEqualTo(0);
        assertThat(pagination.isHasNext()).isFalse();
    }
}
