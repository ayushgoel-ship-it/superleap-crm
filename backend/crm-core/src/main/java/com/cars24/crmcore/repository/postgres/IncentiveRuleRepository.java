package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.IncentiveRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncentiveRuleRepository extends JpaRepository<IncentiveRuleEntity, UUID> {

    List<IncentiveRuleEntity> findByMetricKey(String metricKey);

    List<IncentiveRuleEntity> findByScope(String scope);
}
