package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.controller.support.PaginationHelper;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.response.UnreadCountResponse;
import com.cars24.crmcore.dto.NotificationItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.NotificationEntity;
import com.cars24.crmcore.service.internal.NotificationCommandService;
import com.cars24.crmcore.service.internal.NotificationQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/web/v1/notifications")
@Tag(name = "Notifications", description = "User notifications — list, unread count, mark read")
public class NotificationController {

    private final NotificationQueryService notificationQueryService;
    private final NotificationCommandService notificationCommandService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public NotificationController(NotificationQueryService notificationQueryService,
                                  NotificationCommandService notificationCommandService,
                                  ActorScopeResolver actorScopeResolver,
                                  ApiResponseBuilder responseBuilder) {
        this.notificationQueryService = notificationQueryService;
        this.notificationCommandService = notificationCommandService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping
    @Operation(summary = "List notifications", description = "Paginated notification list for current user")
    @ApiResponse(responseCode = "200", description = "Notifications retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<NotificationItem>>> list(
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "page_size", required = false) Integer pageSize) {

        Pageable pageable = PaginationHelper.toPageable(page, pageSize);
        String userId = actorScopeResolver.getEffectiveUserId();

        PaginatedResponse<NotificationItem> result = notificationQueryService.listNotifications(userId, pageable);

        return ResponseEntity.ok(responseBuilder.okPaginated(result));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Unread count", description = "Get unread notification count for current user")
    @ApiResponse(responseCode = "200", description = "Count retrieved")
    public ResponseEntity<ApiResponseEnvelope<UnreadCountResponse>> unreadCount() {
        String userId = actorScopeResolver.getEffectiveUserId();
        long count = notificationQueryService.getUnreadCount(userId);

        UnreadCountResponse data = UnreadCountResponse.builder().unreadCount(count).build();
        return ResponseEntity.ok(responseBuilder.ok(data));
    }

    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Mark as read", description = "Mark a notification as read")
    @ApiResponse(responseCode = "200", description = "Notification marked as read")
    public ResponseEntity<ApiResponseEnvelope<NotificationEntity>> markAsRead(
            @PathVariable("notificationId") UUID notificationId) {

        String userId = actorScopeResolver.getEffectiveUserId();
        NotificationEntity updated = notificationCommandService.markAsRead(notificationId, userId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }
}
