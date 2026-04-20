package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.entity.TeamEntity;
import com.cars24.crmcore.service.internal.TeamCommandService;
import com.cars24.crmcore.service.internal.TeamQueryService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminTeamControllerTest {

    @Mock private TeamCommandService teamCommandService;
    @Mock private TeamQueryService teamQueryService;

    private MockMvc mockMvc;
    private static final UUID ADMIN_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        CrmRequestContextHolder.set(adminContext());
        AdminTeamController controller = new AdminTeamController(
                teamCommandService,
                teamQueryService,
                new ActorScopeResolver(new RequestContextAccessor()),
                new ApiResponseBuilder());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @AfterEach
    void tearDown() { CrmRequestContextHolder.clear(); }

    @Test
    void listTeams_returnsAll() throws Exception {
        TeamEntity team = new TeamEntity();
        team.setTeamId(UUID.randomUUID());
        team.setTeamName("Alpha");

        when(teamQueryService.listTeams(null)).thenReturn(List.of(team));

        mockMvc.perform(get("/web/v1/admin/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].teamName").value("Alpha"));

        verify(teamQueryService).listTeams(null);
    }

    @Test
    void listTeams_filtersByRegion() throws Exception {
        when(teamQueryService.listTeams("North")).thenReturn(List.of(new TeamEntity()));

        mockMvc.perform(get("/web/v1/admin/teams").param("region", "North"))
                .andExpect(status().isOk());

        verify(teamQueryService).listTeams("North");
    }

    @Test
    void getTeam_returnsDetail() throws Exception {
        UUID teamId = UUID.randomUUID();
        TeamEntity team = new TeamEntity();
        team.setTeamId(teamId);
        team.setTeamName("Beta");

        when(teamQueryService.getTeamDetail(teamId)).thenReturn(team);

        mockMvc.perform(get("/web/v1/admin/teams/{teamId}", teamId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.teamName").value("Beta"));

        verify(teamQueryService).getTeamDetail(teamId);
    }

    @Test
    void createTeam_returns201() throws Exception {
        TeamEntity created = new TeamEntity();
        created.setTeamId(UUID.randomUUID());
        created.setTeamName("Gamma");

        when(teamCommandService.createTeam(any(), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(created);

        String json = """
                {"team_name":"Gamma","region":"South","city":"Chennai"}
                """;

        mockMvc.perform(post("/web/v1/admin/teams")
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.teamName").value("Gamma"));

        verify(teamCommandService).createTeam(any(), eq(ADMIN_USER_ID), anyString());
    }

    @Test
    void updateTeam_returns200() throws Exception {
        UUID teamId = UUID.randomUUID();
        TeamEntity updated = new TeamEntity();
        updated.setTeamId(teamId);
        updated.setTeamName("Updated");

        when(teamCommandService.updateTeam(eq(teamId), any(), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(updated);

        String json = """
                {"team_name":"Updated"}
                """;

        mockMvc.perform(put("/web/v1/admin/teams/{teamId}", teamId)
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.teamName").value("Updated"));

        verify(teamCommandService).updateTeam(eq(teamId), any(), eq(ADMIN_USER_ID), anyString());
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
