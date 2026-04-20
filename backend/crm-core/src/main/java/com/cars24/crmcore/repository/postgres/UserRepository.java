package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    List<UserEntity> findByTeamId(UUID teamId);

    List<UserEntity> findByRole(String role);

    List<UserEntity> findByActiveTrue();
}
