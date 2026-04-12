package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.UserRepository;
import com.cars24.crmcore.service.internal.UserQueryService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class UserQueryServiceImpl implements UserQueryService {

    private final UserRepository userRepository;

    public UserQueryServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public List<UserEntity> listUsers(String role, UUID teamId, Boolean active) {
        if (role != null) {
            List<UserEntity> byRole = userRepository.findByRole(role);
            return applyActiveFilter(byRole, active);
        }
        if (teamId != null) {
            List<UserEntity> byTeam = userRepository.findByTeamId(teamId);
            return applyActiveFilter(byTeam, active);
        }
        if (Boolean.TRUE.equals(active)) {
            return userRepository.findByActiveTrue();
        }
        return userRepository.findAll();
    }

    @Override
    public UserEntity getUserDetail(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private List<UserEntity> applyActiveFilter(List<UserEntity> users, Boolean active) {
        if (active == null) return users;
        return users.stream()
                .filter(u -> active.equals(u.getActive()))
                .toList();
    }
}
