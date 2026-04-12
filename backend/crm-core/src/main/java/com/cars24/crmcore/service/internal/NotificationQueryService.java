package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.NotificationItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import org.springframework.data.domain.Pageable;

public interface NotificationQueryService {

    PaginatedResponse<NotificationItem> listNotifications(String userId, Pageable pageable);

    long getUnreadCount(String userId);
}
