package com.cars24.crmcore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationItem {

    private UUID notificationId;
    private String type;
    private String title;
    private String message;
    private String targetType;
    private String targetId;
    private Boolean isRead;
    private Instant createdAt;
}
