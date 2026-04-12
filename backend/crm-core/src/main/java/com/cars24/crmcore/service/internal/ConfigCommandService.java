package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.command.*;
import com.cars24.crmcore.entity.IncentiveRuleEntity;
import com.cars24.crmcore.entity.IncentiveSlabEntity;

import java.util.UUID;

public interface ConfigCommandService {

    IncentiveSlabEntity createSlab(CreateIncentiveSlabCommand command, UUID actorId, String requestId);

    IncentiveSlabEntity updateSlab(UUID slabId, UpdateIncentiveSlabCommand command, UUID actorId, String requestId);

    IncentiveRuleEntity createRule(CreateIncentiveRuleCommand command, UUID actorId, String requestId);

    IncentiveRuleEntity updateRule(UUID ruleId, UpdateIncentiveRuleCommand command, UUID actorId, String requestId);
}
