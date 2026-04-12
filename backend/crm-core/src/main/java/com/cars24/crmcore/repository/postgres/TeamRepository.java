package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.TeamEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<TeamEntity, UUID> {

    List<TeamEntity> findByRegion(String region);
}
