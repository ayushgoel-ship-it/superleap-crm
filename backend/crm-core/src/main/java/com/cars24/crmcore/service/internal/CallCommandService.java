package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.command.RegisterCallCommand;
import com.cars24.crmcore.dto.command.SubmitCallFeedbackCommand;
import com.cars24.crmcore.entity.CallEventEntity;

import java.util.UUID;

public interface CallCommandService {

    CallEventEntity registerCall(RegisterCallCommand command, String requestId);

    CallEventEntity submitFeedback(UUID callId, SubmitCallFeedbackCommand command,
                                   UUID actorId, String actorRole, String requestId);
}
