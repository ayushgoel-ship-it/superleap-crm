package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.CreateTeamRequest;
import com.cars24.crmapi.dto.web.request.UpdateTeamRequest;
import com.cars24.crmcore.dto.command.CreateTeamCommand;
import com.cars24.crmcore.dto.command.UpdateTeamCommand;
import com.cars24.crmcore.entity.TeamEntity;
import com.cars24.crmcore.service.internal.TeamCommandService;
import com.cars24.crmcore.service.internal.TeamQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/web/v1/admin/teams")
@Tag(name = "Admin — Teams", description = "Team management (ADMIN only)")
public class AdminTeamController extends BaseController {

    private final TeamCommandService teamCommandService;
    private final TeamQueryService teamQueryService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public AdminTeamController(TeamCommandService teamCommandService,
                               TeamQueryService teamQueryService,
                               ActorScopeResolver actorScopeResolver,
                               ApiResponseBuilder responseBuilder) {
        this.teamCommandService = teamCommandService;
        this.teamQueryService = teamQueryService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping
    @Operation(summary = "List teams", description = "List all teams, optionally filtered by region")
    @ApiResponse(responseCode = "200", description = "Teams retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<TeamEntity>>> listTeams(
            @RequestParam(name = "region", required = false) String region) {

        actorScopeResolver.requireRole("ADMIN");
        List<TeamEntity> teams = teamQueryService.listTeams(region);
        return ResponseEntity.ok(responseBuilder.ok(teams));
    }

    @GetMapping("/{teamId}")
    @Operation(summary = "Get team detail", description = "Get a single team by ID")
    @ApiResponse(responseCode = "200", description = "Team retrieved")
    public ResponseEntity<ApiResponseEnvelope<TeamEntity>> getTeam(
            @PathVariable("teamId") UUID teamId) {

        actorScopeResolver.requireRole("ADMIN");
        TeamEntity team = teamQueryService.getTeamDetail(teamId);
        return ResponseEntity.ok(responseBuilder.ok(team));
    }

    @PostMapping
    @Operation(summary = "Create team", description = "Create a new team with region, city, and optional TL")
    @ApiResponse(responseCode = "201", description = "Team created")
    public ResponseEntity<ApiResponseEnvelope<TeamEntity>> createTeam(
            @Valid @RequestBody CreateTeamRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        CreateTeamCommand command = CreateTeamCommand.builder()
                .teamName(request.getTeamName())
                .region(request.getRegion())
                .city(request.getCity())
                .tlUserId(request.getTlUserId())
                .build();

        TeamEntity created = teamCommandService.createTeam(command, actorId, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(created));
    }

    @PutMapping("/{teamId}")
    @Operation(summary = "Update team", description = "Modify team name, region, city, or TL assignment")
    @ApiResponse(responseCode = "200", description = "Team updated")
    public ResponseEntity<ApiResponseEnvelope<TeamEntity>> updateTeam(
            @PathVariable("teamId") UUID teamId,
            @Valid @RequestBody UpdateTeamRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        UpdateTeamCommand command = UpdateTeamCommand.builder()
                .teamName(request.getTeamName())
                .region(request.getRegion())
                .city(request.getCity())
                .tlUserId(request.getTlUserId())
                .build();

        TeamEntity updated = teamCommandService.updateTeam(teamId, command, actorId, requestId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }
}
