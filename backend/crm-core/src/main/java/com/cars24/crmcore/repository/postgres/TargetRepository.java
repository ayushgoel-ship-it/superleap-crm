package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.TargetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TargetRepository extends JpaRepository<TargetEntity, UUID> {

    Optional<TargetEntity> findByUserIdAndPeriod(String userId, String period);

    List<TargetEntity> findByPeriod(String period);

    List<TargetEntity> findByTeamIdAndPeriod(String teamId, String period);
}
