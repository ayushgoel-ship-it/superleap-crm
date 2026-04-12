package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.dto.NotificationItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.NotificationEntity;
import com.cars24.crmcore.service.internal.NotificationCommandService;
import com.cars24.crmcore.service.internal.NotificationQueryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerDelegationTest {

    @Mock private NotificationQueryService notificationQueryService;
    @Mock private NotificationCommandService notificationCommandService;

    private NotificationController notificationController;
    private MockMvc mockMvc;

    private static final String USER_ID = "user-abc";

    @BeforeEach
    void setUp() {
        RequestContext ctx = RequestContext.builder()
                .authenticated(true)
                .effectiveActor(ActorContext.builder()
                        .userId(USER_ID)
                        .roles(List.of("KAM"))
                        .permissions(List.of())
                        .tenantGroup("cars24")
                        .build())
                .actorScope(ActorScope.SELF)
                .metadata(AuthMetadata.builder().requestId("req-test").build())
                .build();
        CrmRequestContextHolder.set(ctx);

        RequestContextAccessor accessor = new RequestContextAccessor();
        ActorScopeResolver actorScopeResolver = new ActorScopeResolver(accessor);
        ApiResponseBuilder responseBuilder = new ApiResponseBuilder();

        notificationController = new NotificationController(
                notificationQueryService, notificationCommandService, actorScopeResolver, responseBuilder);
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController).build();
    }

    @AfterEach
    void tearDown() {
        CrmRequestContextHolder.clear();
    }

    @Test
    void list_delegatesWithUserId() throws Exception {
        PaginatedResponse<NotificationItem> serviceResult = PaginatedResponse.<NotificationItem>builder()
                .items(List.of()).page(0).pageSize(20).totalItems(0).totalPages(0)
                .build();
        when(notificationQueryService.listNotifications(eq(USER_ID), any())).thenReturn(serviceResult);

        mockMvc.perform(get("/web/v1/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(notificationQueryService).listNotifications(eq(USER_ID), any());
    }

    @Test
    void unreadCount_delegatesAndReturnsCount() throws Exception {
        when(notificationQueryService.getUnreadCount(USER_ID)).thenReturn(5L);

        mockMvc.perform(get("/web/v1/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.unread_count").value(5));

        verify(notificationQueryService).getUnreadCount(USER_ID);
    }

    @Test
    void markAsRead_delegatesToCommandService() throws Exception {
        UUID notificationId = UUID.randomUUID();
        NotificationEntity updated = new NotificationEntity();
        updated.setNotificationId(notificationId);
        updated.setUserId(USER_ID);
        updated.setIsRead(true);
        updated.setReadAt(Instant.now());

        when(notificationCommandService.markAsRead(notificationId, USER_ID)).thenReturn(updated);

        mockMvc.perform(put("/web/v1/notifications/{notificationId}/read", notificationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isRead").value(true));

        verify(notificationCommandService).markAsRead(notificationId, USER_ID);
    }
}
