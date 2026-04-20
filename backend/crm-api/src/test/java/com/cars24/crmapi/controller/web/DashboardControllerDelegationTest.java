package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.dto.DashboardSummary;
import com.cars24.crmcore.service.internal.DashboardQueryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DashboardControllerDelegationTest {

    @Mock private DashboardQueryService dashboardQueryService;

    @AfterEach
    void tearDown() {
        CrmRequestContextHolder.clear();
    }

    private DashboardController buildController(ActorScope scope, UUID userId, String role) {
        RequestContext ctx = RequestContext.builder()
                .authenticated(true)
                .effectiveActor(ActorContext.builder()
                        .userId(userId.toString())
                        .roles(List.of(role))
                        .permissions(List.of())
                        .tenantGroup("cars24")
                        .build())
                .actorScope(scope)
                .metadata(AuthMetadata.builder().requestId("req-test").build())
                .build();
        CrmRequestContextHolder.set(ctx);

        RequestContextAccessor accessor = new RequestContextAccessor();
        return new DashboardController(
                dashboardQueryService,
                new ActorScopeResolver(accessor),
                new ApiResponseBuilder());
    }

    @Test
    void home_kamScope_passesOwnUserId() throws Exception {
        UUID kamId = UUID.randomUUID();
        DashboardController controller = buildController(ActorScope.SELF, kamId, "KAM");

        DashboardSummary summary = DashboardSummary.builder().build();
        when(dashboardQueryService.getDashboardSummary(kamId, "KAM")).thenReturn(summary);

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(get("/web/v1/dashboard/home"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.meta.time_scope").value("mtd"));

        verify(dashboardQueryService).getDashboardSummary(kamId, "KAM");
    }

    @Test
    void home_adminScope_passesNullUserId() throws Exception {
        UUID adminId = UUID.randomUUID();
        DashboardController controller = buildController(ActorScope.GLOBAL, adminId, "ADMIN");

        DashboardSummary summary = DashboardSummary.builder().build();
        when(dashboardQueryService.getDashboardSummary(null, "ADMIN")).thenReturn(summary);

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(get("/web/v1/dashboard/home").param("time_scope", "wtd"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.time_scope").value("wtd"));

        verify(dashboardQueryService).getDashboardSummary(null, "ADMIN");
    }

    @Test
    void home_defaultTimeScope_isMtd() throws Exception {
        UUID kamId = UUID.randomUUID();
        DashboardController controller = buildController(ActorScope.SELF, kamId, "KAM");

        DashboardSummary summary = DashboardSummary.builder().build();
        when(dashboardQueryService.getDashboardSummary(any(), eq("KAM"))).thenReturn(summary);

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(get("/web/v1/dashboard/home"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.time_scope").value("mtd"));
    }
}
