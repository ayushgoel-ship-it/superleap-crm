package com.cars24.crmapi.controller.support;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that the API response envelope serializes to the exact JSON shape
 * expected by the legacy frontend contract:
 * { success, data, meta: { timestamp, request_id, role, time_scope, pagination }, error }
 */
class ResponseEnvelopeShapeTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ApiResponseBuilder builder = new ApiResponseBuilder();

    @BeforeEach
    void setUp() {
        RequestContext ctx = RequestContext.builder()
                .authenticated(true)
                .effectiveActor(ActorContext.builder()
                        .userId("user-123")
                        .roles(List.of("KAM"))
                        .permissions(List.of())
                        .tenantGroup("cars24")
                        .build())
                .actorScope(ActorScope.SELF)
                .metadata(AuthMetadata.builder()
                        .requestId("req-shape-test")
                        .build())
                .build();
        CrmRequestContextHolder.set(ctx);
    }

    @AfterEach
    void tearDown() {
        CrmRequestContextHolder.clear();
    }

    @Test
    void simpleOk_hasCorrectTopLevelKeys() throws Exception {
        ApiResponseEnvelope<Map<String, String>> envelope = builder.ok(Map.of("key", "value"));
        String json = objectMapper.writeValueAsString(envelope);
        JsonNode root = objectMapper.readTree(json);

        // Top-level keys
        assertThat(root.has("success")).isTrue();
        assertThat(root.get("success").asBoolean()).isTrue();
        assertThat(root.has("data")).isTrue();
        assertThat(root.has("meta")).isTrue();
        assertThat(root.has("error")).isFalse(); // null → omitted by @JsonInclude(NON_NULL)

        // data
        assertThat(root.get("data").get("key").asText()).isEqualTo("value");

        // meta
        JsonNode meta = root.get("meta");
        assertThat(meta.has("timestamp")).isTrue();
        assertThat(meta.get("request_id").asText()).isEqualTo("req-shape-test");
        assertThat(meta.get("role").asText()).isEqualTo("KAM");
        // time_scope and pagination should be absent (null → omitted)
        assertThat(meta.has("time_scope")).isFalse();
        assertThat(meta.has("pagination")).isFalse();
    }

    @Test
    void okWithTimeScope_includesTimeScopeInMeta() throws Exception {
        ApiResponseEnvelope<String> envelope = builder.ok("data", "mtd");
        String json = objectMapper.writeValueAsString(envelope);
        JsonNode root = objectMapper.readTree(json);

        assertThat(root.get("meta").get("time_scope").asText()).isEqualTo("mtd");
    }

    @Test
    void paginatedResponse_includesPaginationInMeta() throws Exception {
        PaginatedResponse<String> page = PaginatedResponse.<String>builder()
                .items(List.of("item1", "item2"))
                .page(0)
                .pageSize(10)
                .totalItems(25)
                .totalPages(3)
                .build();

        ApiResponseEnvelope<List<String>> envelope = builder.okPaginated(page);
        String json = objectMapper.writeValueAsString(envelope);
        JsonNode root = objectMapper.readTree(json);

        // data is the items array
        assertThat(root.get("data").isArray()).isTrue();
        assertThat(root.get("data").size()).isEqualTo(2);

        // pagination uses snake_case
        JsonNode pagination = root.get("meta").get("pagination");
        assertThat(pagination).isNotNull();
        assertThat(pagination.get("page").asInt()).isEqualTo(1); // 0-based → 1-based
        assertThat(pagination.get("page_size").asInt()).isEqualTo(10);
        assertThat(pagination.get("total_items").asInt()).isEqualTo(25);
        assertThat(pagination.get("total_pages").asInt()).isEqualTo(3);
        assertThat(pagination.get("has_next").asBoolean()).isTrue();
    }

    @Test
    void paginatedResponse_lastPage_hasNextFalse() throws Exception {
        PaginatedResponse<String> page = PaginatedResponse.<String>builder()
                .items(List.of("last"))
                .page(2) // 0-based page 2 → 1-based page 3 (last of 3)
                .pageSize(10)
                .totalItems(25)
                .totalPages(3)
                .build();

        ApiResponseEnvelope<List<String>> envelope = builder.okPaginated(page);
        String json = objectMapper.writeValueAsString(envelope);
        JsonNode pagination = objectMapper.readTree(json).get("meta").get("pagination");

        assertThat(pagination.get("page").asInt()).isEqualTo(3);
        assertThat(pagination.get("has_next").asBoolean()).isFalse();
    }

    @Test
    void paginatedResponse_emptyResult() throws Exception {
        PaginatedResponse<String> page = PaginatedResponse.<String>builder()
                .items(List.of())
                .page(0)
                .pageSize(20)
                .totalItems(0)
                .totalPages(0)
                .build();

        ApiResponseEnvelope<List<String>> envelope = builder.okPaginated(page);
        String json = objectMapper.writeValueAsString(envelope);
        JsonNode root = objectMapper.readTree(json);

        assertThat(root.get("data").isArray()).isTrue();
        assertThat(root.get("data").size()).isEqualTo(0);

        JsonNode pagination = root.get("meta").get("pagination");
        assertThat(pagination.get("page").asInt()).isEqualTo(1);
        assertThat(pagination.get("total_items").asInt()).isEqualTo(0);
        assertThat(pagination.get("has_next").asBoolean()).isFalse();
    }

    @Test
    void noRequestContext_generatesRequestId() throws Exception {
        CrmRequestContextHolder.clear();

        ApiResponseEnvelope<String> envelope = builder.ok("test");
        String json = objectMapper.writeValueAsString(envelope);
        JsonNode meta = objectMapper.readTree(json).get("meta");

        assertThat(meta.get("request_id").asText()).startsWith("req-");
        // role should be absent (null → omitted)
        assertThat(meta.has("role")).isFalse();
    }
}
