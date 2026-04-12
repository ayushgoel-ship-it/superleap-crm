package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.entity.NotificationEntity;
import com.cars24.crmcore.exception.ForbiddenException;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.NotificationRepository;
import com.cars24.crmcore.service.internal.NotificationCommandService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class NotificationCommandServiceImpl implements NotificationCommandService {

    private final NotificationRepository notificationRepository;

    public NotificationCommandServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional
    public NotificationEntity createNotification(String userId, String type, String title,
                                                  String message, String targetType, String targetId) {
        NotificationEntity entity = new NotificationEntity();
        entity.setUserId(userId);
        entity.setType(type);
        entity.setTitle(title);
        entity.setMessage(message);
        entity.setTargetType(targetType);
        entity.setTargetId(targetId);
        entity.setIsRead(false);
        entity.setCreatedAt(Instant.now());
        return notificationRepository.save(entity);
    }

    @Override
    @Transactional
    public NotificationEntity markAsRead(UUID notificationId, String userId) {
        NotificationEntity entity = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found: " + notificationId));

        if (!userId.equals(entity.getUserId())) {
            throw new ForbiddenException("Cannot mark another user's notification as read");
        }

        entity.setIsRead(true);
        entity.setReadAt(Instant.now());
        return notificationRepository.save(entity);
    }
}
