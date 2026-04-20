package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.command.CreateUserCommand;
import com.cars24.crmcore.dto.command.UpdateUserCommand;
import com.cars24.crmcore.entity.UserEntity;

import java.util.UUID;

public interface UserCommandService {

    UserEntity createUser(CreateUserCommand command, UUID actorId, String requestId);

    UserEntity updateUser(UUID userId, UpdateUserCommand command, UUID actorId, String requestId);

    UserEntity deactivateUser(UUID userId, UUID actorId, String requestId);

    UserEntity reactivateUser(UUID userId, UUID actorId, String requestId);
}
