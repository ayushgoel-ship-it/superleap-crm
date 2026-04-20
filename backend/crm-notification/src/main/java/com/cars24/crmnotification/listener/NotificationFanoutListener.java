package com.cars24.crmnotification.listener;

import com.cars24.crmcore.event.NotificationRequestedEvent;
import com.cars24.crmcore.service.internal.NotificationCommandService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listens for NotificationRequestedEvent published by write operations in crm-core,
 * then delegates to NotificationCommandService to create the notification record.
 * Runs asynchronously to avoid blocking the calling transaction.
 */
@Component
public class NotificationFanoutListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationFanoutListener.class);

    private final NotificationCommandService notificationCommandService;

    public NotificationFanoutListener(NotificationCommandService notificationCommandService) {
        this.notificationCommandService = notificationCommandService;
    }

    @Async("crmAsyncExecutor")
    @EventListener
    public void onNotificationRequested(NotificationRequestedEvent event) {
        log.info("Processing notification event: type={}, userId={}, title={}",
                event.getType(), event.getUserId(), event.getTitle());

        try {
            notificationCommandService.createNotification(
                    event.getUserId(),
                    event.getType(),
                    event.getTitle(),
                    event.getMessage(),
                    event.getTargetType(),
                    event.getTargetId());
        } catch (Exception e) {
            log.error("Failed to create notification for userId={}: {}",
                    event.getUserId(), e.getMessage(), e);
        }
    }
}
