package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.entity.TargetEntity;
import com.cars24.crmcore.service.internal.TargetCommandService;
import com.cars24.crmcore.service.internal.TargetQueryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminTargetControllerTest {

    @Mock private TargetCommandService targetCommandService;
    @Mock private TargetQueryService targetQueryService;

    private MockMvc mockMvc;
    private static final UUID ADMIN_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        CrmRequestContextHolder.set(adminContext());
        AdminTargetController controller = new AdminTargetController(
                targetCommandService,
                targetQueryService,
                new ActorScopeResolver(new RequestContextAccessor()),
                new ApiResponseBuilder());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @AfterEach
    void tearDown() { CrmRequestContextHolder.clear(); }

    @Test
    void listTargets_byPeriod() throws Exception {
        TargetEntity t = new TargetEntity();
        t.setTargetId(UUID.randomUUID());
        t.setPeriod("2026-04");
        t.setSiTarget(40);

        when(targetQueryService.listByPeriod("2026-04")).thenReturn(List.of(t));

        mockMvc.perform(get("/web/v1/admin/targets").param("period", "2026-04"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].period").value("2026-04"));

        verify(targetQueryService).listByPeriod("2026-04");
    }

    @Test
    void updateTarget_returns200() throws Exception {
        UUID targetId = UUID.randomUUID();
        TargetEntity updated = new TargetEntity();
        updated.setTargetId(targetId);
        updated.setSiTarget(50);
        updated.setCallTarget(200);

        when(targetCommandService.updateTarget(eq(targetId), any(), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(updated);

        String json = """
                {"si_target":50,"call_target":200,"visit_target":30}
                """;

        mockMvc.perform(put("/web/v1/admin/targets/{targetId}", targetId)
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.siTarget").value(50));

        verify(targetCommandService).updateTarget(eq(targetId), any(), eq(ADMIN_USER_ID), anyString());
    }

    @Test
    void initializeMonthTargets_returns201() throws Exception {
        TargetEntity t1 = new TargetEntity();
        t1.setTargetId(UUID.randomUUID());
        t1.setPeriod("2026-05");

        when(targetCommandService.initializeMonth(any(), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(List.of(t1));

        String json = """
                {"period":"2026-05","source_period":"2026-04"}
                """;

        mockMvc.perform(post("/web/v1/admin/targets/initialize")
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(targetCommandService).initializeMonth(any(), eq(ADMIN_USER_ID), anyString());
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
