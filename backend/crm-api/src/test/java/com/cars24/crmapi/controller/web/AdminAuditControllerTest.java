package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.AuditLogEntity;
import com.cars24.crmcore.service.internal.AuditQueryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminAuditControllerTest {

    @Mock private AuditQueryService auditQueryService;

    private MockMvc mockMvc;
    private static final UUID ADMIN_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        CrmRequestContextHolder.set(adminContext());
        AdminAuditController controller = new AdminAuditController(
                auditQueryService,
                new ActorScopeResolver(new RequestContextAccessor()),
                new ApiResponseBuilder());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @AfterEach
    void tearDown() { CrmRequestContextHolder.clear(); }

    @Test
    void listAuditLogs_noFilter() throws Exception {
        AuditLogEntity log = new AuditLogEntity();
        log.setLogId(UUID.randomUUID());
        log.setAction("USER_CREATE");
        log.setEntityType("users");
        log.setCreatedAt(Instant.now());

        PaginatedResponse<AuditLogEntity> response = PaginatedResponse.<AuditLogEntity>builder()
                .items(List.of(log))
                .page(0).pageSize(20).totalItems(1).totalPages(1)
                .build();

        when(auditQueryService.listAuditLogs(eq(null), eq(null), any())).thenReturn(response);

        mockMvc.perform(get("/web/v1/admin/audit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].action").value("USER_CREATE"));

        verify(auditQueryService).listAuditLogs(eq(null), eq(null), any());
    }

    @Test
    void listAuditLogs_withEntityFilter() throws Exception {
        AuditLogEntity log = new AuditLogEntity();
        log.setLogId(UUID.randomUUID());
        log.setAction("TARGET_UPDATE");
        log.setEntityType("targets");
        log.setEntityId("some-id");

        PaginatedResponse<AuditLogEntity> response = PaginatedResponse.<AuditLogEntity>builder()
                .items(List.of(log))
                .page(0).pageSize(20).totalItems(1).totalPages(1)
                .build();

        when(auditQueryService.listAuditLogs(eq("targets"), eq("some-id"), any())).thenReturn(response);

        mockMvc.perform(get("/web/v1/admin/audit")
                        .param("entity_type", "targets")
                        .param("entity_id", "some-id"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].entityType").value("targets"));

        verify(auditQueryService).listAuditLogs(eq("targets"), eq("some-id"), any());
    }

    private RequestContext adminContext() {
        return RequestContext.builder()
                .authenticated(true)
                .effectiveActor(ActorContext.builder()
                        .userId(ADMIN_USER_ID.toString())
                        .roles(List.of("ADMIN"))
                        .permissions(List.of())
                        .tenantGroup("cars24")
                        .build())
                .actorScope(ActorScope.GLOBAL)
                .metadata(AuthMetadata.builder().requestId("req-admin").build())
                .build();
    }
}
