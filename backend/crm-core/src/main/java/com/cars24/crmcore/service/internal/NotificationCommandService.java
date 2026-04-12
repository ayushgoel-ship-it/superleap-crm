package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.entity.NotificationEntity;

import java.util.UUID;

public interface NotificationCommandService {

    NotificationEntity createNotification(String userId, String type, String title,
                                          String message, String targetType, String targetId);

    NotificationEntity markAsRead(UUID notificationId, String userId);
}
