package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.service.internal.OrgQueryService;
import com.cars24.crmcore.dto.OrgHierarchyDto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class BootstrapControllerDelegationTest {

    @Mock private OrgQueryService orgQueryService;

    @AfterEach
    void tearDown() {
        CrmRequestContextHolder.clear();
    }

    private BootstrapController buildController(ActorScope scope, String userId, String role) {
        RequestContext ctx = RequestContext.builder()
                .authenticated(true)
                .effectiveActor(ActorContext.builder()
                        .userId(userId)
                        .roles(List.of(role))
                        .permissions(List.of("read:dealers"))
                        .tenantGroup("cars24")
                        .build())
                .actorScope(scope)
                .metadata(AuthMetadata.builder().requestId("req-test").build())
                .build();
        CrmRequestContextHolder.set(ctx);

        RequestContextAccessor accessor = new RequestContextAccessor();
        return new BootstrapController(
                orgQueryService,
                new ActorScopeResolver(accessor),
                new ApiResponseBuilder());
    }

    @Test
    void bootstrap_kamScope_excludesOrgHierarchy() throws Exception {
        BootstrapController controller = buildController(ActorScope.SELF, "kam-001", "KAM");
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(get("/web/v1/bootstrap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profile.user_id").value("kam-001"))
                .andExpect(jsonPath("$.data.profile.role").value("KAM"));

        // KAM (SELF scope) should NOT trigger org hierarchy lookup
        verify(orgQueryService, never()).getOrgHierarchy();
    }

    @Test
    void bootstrap_tlScope_includesOrgHierarchy() throws Exception {
        BootstrapController controller = buildController(ActorScope.TEAM, "tl-001", "TL");

        OrgHierarchyDto orgHierarchy = OrgHierarchyDto.builder()
                .regions(List.of())
                .build();
        when(orgQueryService.getOrgHierarchy()).thenReturn(orgHierarchy);

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(get("/web/v1/bootstrap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.profile.role").value("TL"));

        // TL (TEAM scope) SHOULD trigger org hierarchy lookup
        verify(orgQueryService).getOrgHierarchy();
    }

    @Test
    void bootstrap_adminScope_includesOrgHierarchy() throws Exception {
        BootstrapController controller = buildController(ActorScope.GLOBAL, "admin-001", "ADMIN");

        OrgHierarchyDto orgHierarchy = OrgHierarchyDto.builder()
                .regions(List.of())
                .build();
        when(orgQueryService.getOrgHierarchy()).thenReturn(orgHierarchy);

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(get("/web/v1/bootstrap"))
                .andExpect(status().isOk());

        verify(orgQueryService).getOrgHierarchy();
    }
}
