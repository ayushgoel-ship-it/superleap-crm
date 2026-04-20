package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.entity.UserEntity;

import java.util.List;
import java.util.UUID;

public interface UserQueryService {

    List<UserEntity> listUsers(String role, UUID teamId, Boolean active);

    UserEntity getUserDetail(UUID userId);
}
