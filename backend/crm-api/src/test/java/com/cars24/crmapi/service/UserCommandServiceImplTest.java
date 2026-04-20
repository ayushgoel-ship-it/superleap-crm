package com.cars24.crmapi.service;

import com.cars24.crmcore.dto.command.CreateUserCommand;
import com.cars24.crmcore.dto.command.UpdateUserCommand;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.UserRepository;
import com.cars24.crmcore.service.impl.UserCommandServiceImpl;
import com.cars24.crmcore.service.internal.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserCommandServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private AuditService auditService;

    private UserCommandServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserCommandServiceImpl(userRepository, auditService);
    }

    @Test
    void createUser_setsDefaultsAndSaves() {
        UUID actorId = UUID.randomUUID();
        CreateUserCommand command = CreateUserCommand.builder()
                .name("Jane Doe")
                .email("jane@example.com")
                .role("KAM")
                .region("North")
                .build();

        when(userRepository.save(any())).thenAnswer(inv -> {
            UserEntity e = inv.getArgument(0);
            e.setUserId(UUID.randomUUID());
            return e;
        });

        UserEntity result = service.createUser(command, actorId, "req-100");

        assertThat(result.getName()).isEqualTo("Jane Doe");
        assertThat(result.getEmail()).isEqualTo("jane@example.com");
        assertThat(result.getRole()).isEqualTo("KAM");
        assertThat(result.getActive()).isTrue();
        assertThat(result.getMustResetPassword()).isTrue();
        assertThat(result.getCreatedAt()).isNotNull();

        verify(auditService).log(eq(actorId), eq("ADMIN"), eq("USER_CREATE"),
                eq("users"), anyString(), isNull(), isNull(), anyString(), eq("req-100"));
    }

    @Test
    void updateUser_appliesPartialUpdates() {
        UUID userId = UUID.randomUUID();
        UserEntity existing = new UserEntity();
        existing.setUserId(userId);
        existing.setName("Old Name");
        existing.setRole("KAM");

        when(userRepository.findById(userId)).thenReturn(Optional.of(existing));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserCommand command = UpdateUserCommand.builder()
                .name("New Name")
                .role("TL")
                .build();

        UserEntity result = service.updateUser(userId, command, UUID.randomUUID(), "req-200");

        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getRole()).isEqualTo("TL");
        assertThat(result.getUpdatedAt()).isNotNull();
    }

    @Test
    void updateUser_notFound_throwsResourceNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.updateUser(userId, UpdateUserCommand.builder().build(), UUID.randomUUID(), "req-x"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deactivateUser_setsActiveFalse() {
        UUID userId = UUID.randomUUID();
        UserEntity existing = new UserEntity();
        existing.setUserId(userId);
        existing.setName("Test");
        existing.setActive(true);

        when(userRepository.findById(userId)).thenReturn(Optional.of(existing));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserEntity result = service.deactivateUser(userId, UUID.randomUUID(), "req-300");

        assertThat(result.getActive()).isFalse();
    }

    @Test
    void reactivateUser_setsActiveTrue() {
        UUID userId = UUID.randomUUID();
        UserEntity existing = new UserEntity();
        existing.setUserId(userId);
        existing.setName("Test");
        existing.setActive(false);

        when(userRepository.findById(userId)).thenReturn(Optional.of(existing));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserEntity result = service.reactivateUser(userId, UUID.randomUUID(), "req-400");

        assertThat(result.getActive()).isTrue();
    }
}
