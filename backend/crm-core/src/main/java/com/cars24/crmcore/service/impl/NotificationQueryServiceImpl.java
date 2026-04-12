package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.NotificationItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.NotificationEntity;
import com.cars24.crmcore.repository.postgres.NotificationRepository;
import com.cars24.crmcore.service.internal.NotificationQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class NotificationQueryServiceImpl implements NotificationQueryService {

    private final NotificationRepository notificationRepository;

    public NotificationQueryServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public PaginatedResponse<NotificationItem> listNotifications(String userId, Pageable pageable) {
        Page<NotificationEntity> page = notificationRepository.findByUserId(userId, pageable);

        return PaginatedResponse.<NotificationItem>builder()
                .items(page.getContent().stream().map(this::toItem).toList())
                .page(page.getNumber())
                .pageSize(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    public long getUnreadCount(String userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    private NotificationItem toItem(NotificationEntity e) {
        return NotificationItem.builder()
                .notificationId(e.getNotificationId())
                .type(e.getType())
                .title(e.getTitle())
                .message(e.getMessage())
                .targetType(e.getTargetType())
                .targetId(e.getTargetId())
                .isRead(e.getIsRead())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
