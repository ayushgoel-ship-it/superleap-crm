package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.CreateUserRequest;
import com.cars24.crmapi.dto.web.request.UpdateUserRequest;
import com.cars24.crmcore.dto.command.CreateUserCommand;
import com.cars24.crmcore.dto.command.UpdateUserCommand;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.service.internal.UserCommandService;
import com.cars24.crmcore.service.internal.UserQueryService;
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
@RequestMapping("/web/v1/admin/users")
@Tag(name = "Admin — Users", description = "User management (ADMIN only)")
public class AdminUserController extends BaseController {

    private final UserCommandService userCommandService;
    private final UserQueryService userQueryService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public AdminUserController(UserCommandService userCommandService,
                               UserQueryService userQueryService,
                               ActorScopeResolver actorScopeResolver,
                               ApiResponseBuilder responseBuilder) {
        this.userCommandService = userCommandService;
        this.userQueryService = userQueryService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping
    @Operation(summary = "List users", description = "List users filtered by role, team, and active status")
    @ApiResponse(responseCode = "200", description = "Users retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<UserEntity>>> listUsers(
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "team_id", required = false) UUID teamId,
            @RequestParam(name = "active", required = false) Boolean active) {

        actorScopeResolver.requireRole("ADMIN");
        List<UserEntity> users = userQueryService.listUsers(role, teamId, active);
        return ResponseEntity.ok(responseBuilder.ok(users));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user detail", description = "Get a single user by ID")
    @ApiResponse(responseCode = "200", description = "User retrieved")
    public ResponseEntity<ApiResponseEnvelope<UserEntity>> getUser(
            @PathVariable("userId") UUID userId) {

        actorScopeResolver.requireRole("ADMIN");
        UserEntity user = userQueryService.getUserDetail(userId);
        return ResponseEntity.ok(responseBuilder.ok(user));
    }

    @PostMapping
    @Operation(summary = "Create user", description = "Create a new KAM, TL, or ADMIN user")
    @ApiResponse(responseCode = "201", description = "User created")
    public ResponseEntity<ApiResponseEnvelope<UserEntity>> createUser(
            @Valid @RequestBody CreateUserRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        CreateUserCommand command = CreateUserCommand.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(request.getRole())
                .teamId(request.getTeamId())
                .region(request.getRegion())
                .city(request.getCity())
                .build();

        UserEntity created = userCommandService.createUser(command, actorId, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(created));
    }

    @PutMapping("/{userId}")
    @Operation(summary = "Update user", description = "Modify user name, role, team, or region")
    @ApiResponse(responseCode = "200", description = "User updated")
    public ResponseEntity<ApiResponseEnvelope<UserEntity>> updateUser(
            @PathVariable("userId") UUID userId,
            @Valid @RequestBody UpdateUserRequest request) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        UpdateUserCommand command = UpdateUserCommand.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .role(request.getRole())
                .teamId(request.getTeamId())
                .region(request.getRegion())
                .city(request.getCity())
                .build();

        UserEntity updated = userCommandService.updateUser(userId, command, actorId, requestId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }

    @PutMapping("/{userId}/deactivate")
    @Operation(summary = "Deactivate user", description = "Soft-delete a user by marking them inactive")
    @ApiResponse(responseCode = "200", description = "User deactivated")
    public ResponseEntity<ApiResponseEnvelope<UserEntity>> deactivateUser(
            @PathVariable("userId") UUID userId) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        UserEntity updated = userCommandService.deactivateUser(userId, actorId, requestId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }

    @PutMapping("/{userId}/reactivate")
    @Operation(summary = "Reactivate user", description = "Re-enable a previously deactivated user")
    @ApiResponse(responseCode = "200", description = "User reactivated")
    public ResponseEntity<ApiResponseEnvelope<UserEntity>> reactivateUser(
            @PathVariable("userId") UUID userId) {

        actorScopeResolver.requireRole("ADMIN");
        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        UserEntity updated = userCommandService.reactivateUser(userId, actorId, requestId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }
}
