package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.entity.IncentiveRuleEntity;
import com.cars24.crmcore.entity.IncentiveSlabEntity;

import java.util.List;

public interface ConfigQueryService {

    List<IncentiveSlabEntity> listSlabs(String metricKey, String roleScope);

    List<IncentiveRuleEntity> listRules(String metricKey, String scope);
}
