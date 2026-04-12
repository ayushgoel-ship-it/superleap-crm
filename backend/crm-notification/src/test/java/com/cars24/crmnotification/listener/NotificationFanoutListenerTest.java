package com.cars24.crmnotification.listener;

import com.cars24.crmcore.entity.NotificationEntity;
import com.cars24.crmcore.event.NotificationRequestedEvent;
import com.cars24.crmcore.service.internal.NotificationCommandService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationFanoutListenerTest {

    @Mock private NotificationCommandService notificationCommandService;

    private NotificationFanoutListener listener;

    @BeforeEach
    void setUp() {
        listener = new NotificationFanoutListener(notificationCommandService);
    }

    @Test
    void onNotificationRequested_createsNotification() {
        UUID actorId = UUID.randomUUID();
        String userId = UUID.randomUUID().toString();

        NotificationRequestedEvent event = new NotificationRequestedEvent(
                this, actorId, userId, "LEAD_CREATED",
                "New Lead", "A new lead was created by KAM",
                "leads", "LEAD-12345");

        when(notificationCommandService.createNotification(anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString()))
                .thenReturn(new NotificationEntity());

        listener.onNotificationRequested(event);

        verify(notificationCommandService).createNotification(
                eq(userId), eq("LEAD_CREATED"), eq("New Lead"),
                eq("A new lead was created by KAM"),
                eq("leads"), eq("LEAD-12345"));
    }

    @Test
    void onNotificationRequested_swallowsExceptions() {
        UUID actorId = UUID.randomUUID();
        String userId = UUID.randomUUID().toString();

        NotificationRequestedEvent event = new NotificationRequestedEvent(
                this, actorId, userId, "ERROR_TYPE",
                "Test", "Test message", "leads", "LEAD-000");

        when(notificationCommandService.createNotification(anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("DB error"));

        // Should not throw — just logs the error
        listener.onNotificationRequested(event);

        verify(notificationCommandService).createNotification(
                eq(userId), eq("ERROR_TYPE"), eq("Test"),
                eq("Test message"), eq("leads"), eq("LEAD-000"));
    }
}
