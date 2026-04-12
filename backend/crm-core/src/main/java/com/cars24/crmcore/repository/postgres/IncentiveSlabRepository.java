package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.IncentiveSlabEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncentiveSlabRepository extends JpaRepository<IncentiveSlabEntity, UUID> {

    List<IncentiveSlabEntity> findByMetricKey(String metricKey);

    List<IncentiveSlabEntity> findByRoleScope(String roleScope);
}
