package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.command.CreateLeadCommand;
import com.cars24.crmcore.dto.command.UpdateLeadPricingCommand;
import com.cars24.crmcore.entity.LeadEntity;

import java.util.UUID;

public interface LeadCommandService {

    LeadEntity createLead(CreateLeadCommand command, String requestId);

    LeadEntity updatePricing(String leadId, UpdateLeadPricingCommand command,
                             UUID actorId, String actorRole, String requestId);
}
