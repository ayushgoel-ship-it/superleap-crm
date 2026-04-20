package com.cars24.crmapi.controller.app;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.dto.OrgHierarchyDto;
import com.cars24.crmcore.service.internal.OrgQueryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AppBootstrapControllerTest {

    @Mock private OrgQueryService orgQueryService;

    @AfterEach
    void tearDown() { CrmRequestContextHolder.clear(); }

    private MockMvc buildMockMvc(ActorScope scope, String userId, String role) {
        RequestContext ctx = RequestContext.builder()
                .authenticated(true)
                .effectiveActor(ActorContext.builder()
                        .userId(userId)
                        .roles(List.of(role))
                        .permissions(List.of("read:dealers"))
                        .tenantGroup("cars24")
                        .build())
                .actorScope(scope)
                .metadata(AuthMetadata.builder().requestId("req-app").build())
                .build();
        CrmRequestContextHolder.set(ctx);

        AppBootstrapController controller = new AppBootstrapController(
                orgQueryService,
                new ActorScopeResolver(new RequestContextAccessor()),
                new ApiResponseBuilder());
        return MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void bootstrap_kamScope_excludesOrgHierarchy() throws Exception {
        MockMvc mockMvc = buildMockMvc(ActorScope.SELF, "kam-001", "KAM");

        mockMvc.perform(get("/app/v1/bootstrap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profile.user_id").value("kam-001"))
                .andExpect(jsonPath("$.data.profile.role").value("KAM"));

        verify(orgQueryService, never()).getOrgHierarchy();
    }

    @Test
    void bootstrap_tlScope_includesOrgHierarchy() throws Exception {
        OrgHierarchyDto hierarchy = OrgHierarchyDto.builder().regions(List.of()).build();
        when(orgQueryService.getOrgHierarchy()).thenReturn(hierarchy);

        MockMvc mockMvc = buildMockMvc(ActorScope.TEAM, "tl-001", "TL");

        mockMvc.perform(get("/app/v1/bootstrap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.profile.role").value("TL"));

        verify(orgQueryService).getOrgHierarchy();
    }

    @Test
    void bootstrap_adminScope_includesOrgHierarchy() throws Exception {
        OrgHierarchyDto hierarchy = OrgHierarchyDto.builder().regions(List.of()).build();
        when(orgQueryService.getOrgHierarchy()).thenReturn(hierarchy);

        MockMvc mockMvc = buildMockMvc(ActorScope.GLOBAL, "admin-001", "ADMIN");

        mockMvc.perform(get("/app/v1/bootstrap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(orgQueryService).getOrgHierarchy();
    }
}
