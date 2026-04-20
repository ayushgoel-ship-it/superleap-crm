package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.entity.DcfLeadEntity;
import com.cars24.crmcore.dto.command.SubmitDcfOnboardingCommand;

public interface DcfCommandService {

    DcfLeadEntity submitOnboarding(SubmitDcfOnboardingCommand command, String requestId);
}
