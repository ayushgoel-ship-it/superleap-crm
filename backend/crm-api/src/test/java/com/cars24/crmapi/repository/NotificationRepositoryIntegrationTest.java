package com.cars24.crmapi.repository;

import com.cars24.crmapi.CrmApiApplication;
import com.cars24.crmcore.entity.NotificationEntity;
import com.cars24.crmcore.repository.postgres.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = CrmApiApplication.class)
@ActiveProfiles("test")
class NotificationRepositoryIntegrationTest {

    @Autowired
    private NotificationRepository notificationRepository;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();

        notificationRepository.save(createNotification("user1", "ALERT", "New Lead", true));
        notificationRepository.save(createNotification("user1", "TASK", "Follow Up", false));
        notificationRepository.save(createNotification("user1", "ALERT", "Visit Due", false));
        notificationRepository.save(createNotification("user2", "ALERT", "Reminder", false));
    }

    @Test
    void findByUserId_returnsUserNotifications() {
        Page<NotificationEntity> result = notificationRepository.findByUserId("user1", PageRequest.of(0, 10));
        assertEquals(3, result.getTotalElements());
    }

    @Test
    void countUnreadByUserId_returnsCorrectCount() {
        long unread = notificationRepository.countUnreadByUserId("user1");
        assertEquals(2, unread);
    }

    @Test
    void countUnreadByUserId_allRead_returnsZero() {
        long unread = notificationRepository.countUnreadByUserId("user-none");
        assertEquals(0, unread);
    }

    @Test
    void findByUserIdOrderByCreatedAtDesc_orderedCorrectly() {
        var notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc("user1");
        assertEquals(3, notifications.size());
    }

    private NotificationEntity createNotification(String userId, String type, String title, boolean isRead) {
        NotificationEntity n = new NotificationEntity();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setMessage("Test message for " + title);
        n.setIsRead(isRead);
        n.setCreatedAt(Instant.now());
        return n;
    }
}
