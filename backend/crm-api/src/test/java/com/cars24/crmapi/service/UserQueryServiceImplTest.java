package com.cars24.crmapi.service;

import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.UserRepository;
import com.cars24.crmcore.service.impl.UserQueryServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserQueryServiceImplTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private UserQueryServiceImpl service;

    @Test
    void listUsers_byRole() {
        UserEntity u = new UserEntity();
        u.setRole("KAM");
        u.setActive(true);
        when(userRepository.findByRole("KAM")).thenReturn(List.of(u));

        List<UserEntity> result = service.listUsers("KAM", null, null);
        assertThat(result).hasSize(1);
    }

    @Test
    void listUsers_byTeamId() {
        UUID teamId = UUID.randomUUID();
        UserEntity u = new UserEntity();
        u.setTeamId(teamId);
        u.setActive(true);
        when(userRepository.findByTeamId(teamId)).thenReturn(List.of(u));

        List<UserEntity> result = service.listUsers(null, teamId, null);
        assertThat(result).hasSize(1);
    }

    @Test
    void listUsers_activeOnly() {
        UserEntity active = new UserEntity();
        active.setActive(true);
        when(userRepository.findByActiveTrue()).thenReturn(List.of(active));

        List<UserEntity> result = service.listUsers(null, null, true);
        assertThat(result).hasSize(1);
    }

    @Test
    void getUserDetail_found() {
        UUID userId = UUID.randomUUID();
        UserEntity u = new UserEntity();
        u.setUserId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(u));

        UserEntity result = service.getUserDetail(userId);
        assertThat(result.getUserId()).isEqualTo(userId);
    }

    @Test
    void getUserDetail_notFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getUserDetail(userId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
