package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.HierarchyChangeRequest;
import com.cars24.crmcore.dto.HierarchyDryRunResult;
import com.cars24.crmcore.dto.command.HierarchyChangeCommand;
import com.cars24.crmcore.dto.command.HierarchyChangeCommand.HierarchyAssignment;
import com.cars24.crmcore.service.internal.HierarchyCommandService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/web/v1/admin/hierarchy")
@Tag(name = "Admin — Hierarchy", description = "Org hierarchy changes — dry-run and apply (ADMIN only)")
public class AdminHierarchyController extends BaseController {

    private final HierarchyCommandService hierarchyCommandService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public AdminHierarchyController(HierarchyCommandService hierarchyCommandService,
                                     ActorScopeResolver actorScopeResolver,
                                     ApiResponseBuilder responseBuilder) {
        this.hierarchyCommandService = hierarchyCommandService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @PostMapping("/dry-run")
    @Operation(summary = "Hierarchy dry-run", description = "Preview hierarchy changes without committing")
    @ApiResponse(responseCode = "200", description = "Preview generated")
    public ResponseEntity<ApiResponseEnvelope<HierarchyDryRunResult>> dryRun(
            @Valid @RequestBody HierarchyChangeRequest request) {

        actorScopeResolver.requireRole("ADMIN");

        HierarchyChangeCommand command = toCommand(request);
        HierarchyDryRunResult preview = hierarchyCommandService.dryRun(command);

        return ResponseEntity.ok(responseBuilder.ok(preview));
    }

    @PostMapping("/apply")
    @Operation(summary = "Apply hierarchy changes", description = "Commit hierarchy reassignments (user-team-role)")
    @ApiResponse(responseCode = "200", description = "Changes applied")
    public ResponseEntity<ApiResponseEnvelope<HierarchyDryRunResult>> apply(
            @Valid @RequestBody HierarchyChangeRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        HierarchyChangeCommand command = toCommand(request);
        HierarchyDryRunResult result = hierarchyCommandService.apply(command, actorId, requestId);

        return ResponseEntity.ok(responseBuilder.ok(result));
    }

    private HierarchyChangeCommand toCommand(HierarchyChangeRequest request) {
        List<HierarchyAssignment> assignments = request.getAssignments().stream()
                .map(a -> HierarchyAssignment.builder()
                        .userId(a.getUserId())
                        .newTeamId(a.getNewTeamId())
                        .newRole(a.getNewRole())
                        .build())
                .collect(Collectors.toList());

        return HierarchyChangeCommand.builder()
                .assignments(assignments)
                .build();
    }
}
