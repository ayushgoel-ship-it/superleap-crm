package com.cars24.crmcore.event;

import java.util.UUID;

/**
 * Published when a write operation wants to notify a user.
 * Consumed by NotificationFanoutListener in crm-notification module.
 */
public class NotificationRequestedEvent extends CrmEvent {

    private final String userId;
    private final String type;
    private final String title;
    private final String message;
    private final String targetType;
    private final String targetId;

    public NotificationRequestedEvent(Object source, UUID actorId,
                                       String userId, String type,
                                       String title, String message,
                                       String targetType, String targetId) {
        super(source, "NOTIFICATION_REQUESTED", actorId);
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.targetType = targetType;
        this.targetId = targetId;
    }

    public String getUserId() {
        return userId;
    }

    public String getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getTargetType() {
        return targetType;
    }

    public String getTargetId() {
        return targetId;
    }
}
