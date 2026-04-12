package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.config.CacheConfig;
import com.cars24.crmcore.dto.command.CreateUserCommand;
import com.cars24.crmcore.dto.command.UpdateUserCommand;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.UserRepository;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.UserCommandService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class UserCommandServiceImpl implements UserCommandService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    public UserCommandServiceImpl(UserRepository userRepository,
                                  AuditService auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_ORG_HIERARCHY, allEntries = true)
    public UserEntity createUser(CreateUserCommand command, UUID actorId, String requestId) {
        UserEntity entity = new UserEntity();
        entity.setName(command.getName());
        entity.setEmail(command.getEmail());
        entity.setPhone(command.getPhone());
        entity.setRole(command.getRole());
        entity.setTeamId(command.getTeamId());
        entity.setRegion(command.getRegion());
        entity.setCity(command.getCity());
        entity.setActive(true);
        entity.setMustResetPassword(true);
        entity.setCreatedAt(Instant.now());

        UserEntity saved = userRepository.save(entity);

        auditService.log(
                actorId,
                "ADMIN",
                "USER_CREATE",
                "users",
                saved.getUserId().toString(),
                null,
                null,
                "Created user " + command.getName() + " (" + command.getEmail() + ") with role " + command.getRole(),
                requestId);

        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_ORG_HIERARCHY, allEntries = true)
    public UserEntity updateUser(UUID userId, UpdateUserCommand command, UUID actorId, String requestId) {
        UserEntity entity = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        String oldRole = entity.getRole();

        if (command.getName() != null) entity.setName(command.getName());
        if (command.getPhone() != null) entity.setPhone(command.getPhone());
        if (command.getRole() != null) entity.setRole(command.getRole());
        if (command.getTeamId() != null) entity.setTeamId(command.getTeamId());
        if (command.getRegion() != null) entity.setRegion(command.getRegion());
        if (command.getCity() != null) entity.setCity(command.getCity());
        entity.setUpdatedAt(Instant.now());

        UserEntity saved = userRepository.save(entity);

        auditService.log(
                actorId,
                "ADMIN",
                "USER_UPDATE",
                "users",
                userId.toString(),
                oldRole != null ? "{\"role\":\"" + oldRole + "\"}" : null,
                entity.getRole() != null ? "{\"role\":\"" + entity.getRole() + "\"}" : null,
                "Updated user " + entity.getName(),
                requestId);

        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_ORG_HIERARCHY, allEntries = true)
    public UserEntity deactivateUser(UUID userId, UUID actorId, String requestId) {
        UserEntity entity = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        entity.setActive(false);
        entity.setUpdatedAt(Instant.now());

        UserEntity saved = userRepository.save(entity);

        auditService.log(
                actorId,
                "ADMIN",
                "USER_DEACTIVATE",
                "users",
                userId.toString(),
                "{\"active\":true}",
                "{\"active\":false}",
                "Deactivated user " + entity.getName(),
                requestId);

        return saved;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_ORG_HIERARCHY, allEntries = true)
    public UserEntity reactivateUser(UUID userId, UUID actorId, String requestId) {
        UserEntity entity = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        entity.setActive(true);
        entity.setUpdatedAt(Instant.now());

        UserEntity saved = userRepository.save(entity);

        auditService.log(
                actorId,
                "ADMIN",
                "USER_REACTIVATE",
                "users",
                userId.toString(),
                "{\"active\":false}",
                "{\"active\":true}",
                "Reactivated user " + entity.getName(),
                requestId);

        return saved;
    }
}
