package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.dto.HierarchyDryRunResult;
import com.cars24.crmcore.service.internal.HierarchyCommandService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminHierarchyControllerTest {

    @Mock private HierarchyCommandService hierarchyCommandService;

    private MockMvc mockMvc;
    private static final UUID ADMIN_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        CrmRequestContextHolder.set(adminContext());
        AdminHierarchyController controller = new AdminHierarchyController(
                hierarchyCommandService,
                new ActorScopeResolver(new RequestContextAccessor()),
                new ApiResponseBuilder());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @AfterEach
    void tearDown() { CrmRequestContextHolder.clear(); }

    @Test
    void dryRun_returns200() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID newTeamId = UUID.randomUUID();

        HierarchyDryRunResult result = HierarchyDryRunResult.builder()
                .previews(List.of(HierarchyDryRunResult.HierarchyChangePreview.builder()
                        .userId(userId).userName("Test KAM")
                        .oldRole("KAM").newRole("TL")
                        .oldTeamId(UUID.randomUUID()).newTeamId(newTeamId)
                        .affectedDealerCount(5).build()))
                .totalChanges(1).build();

        when(hierarchyCommandService.dryRun(any())).thenReturn(result);

        String json = """
                {"assignments":[{"user_id":"%s","new_team_id":"%s","new_role":"TL"}]}
                """.formatted(userId, newTeamId);

        mockMvc.perform(post("/web/v1/admin/hierarchy/dry-run")
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalChanges").value(1))
                .andExpect(jsonPath("$.data.previews[0].newRole").value("TL"));

        verify(hierarchyCommandService).dryRun(any());
    }

    @Test
    void apply_returns200() throws Exception {
        UUID userId = UUID.randomUUID();

        HierarchyDryRunResult result = HierarchyDryRunResult.builder()
                .previews(List.of(HierarchyDryRunResult.HierarchyChangePreview.builder()
                        .userId(userId).userName("Test KAM")
                        .oldRole("KAM").newRole("TL")
                        .oldTeamId(UUID.randomUUID()).newTeamId(UUID.randomUUID())
                        .affectedDealerCount(3).build()))
                .totalChanges(1).build();

        when(hierarchyCommandService.apply(any(), eq(ADMIN_USER_ID), anyString())).thenReturn(result);

        String json = """
                {"assignments":[{"user_id":"%s","new_role":"TL"}]}
                """.formatted(userId);

        mockMvc.perform(post("/web/v1/admin/hierarchy/apply")
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalChanges").value(1));

        verify(hierarchyCommandService).apply(any(), eq(ADMIN_USER_ID), anyString());
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
