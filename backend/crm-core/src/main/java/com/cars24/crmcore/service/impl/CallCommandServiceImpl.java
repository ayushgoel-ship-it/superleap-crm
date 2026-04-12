package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.command.RegisterCallCommand;
import com.cars24.crmcore.dto.command.SubmitCallFeedbackCommand;
import com.cars24.crmcore.entity.CallEventEntity;
import com.cars24.crmcore.exception.ForbiddenException;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.CallEventRepository;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.CallCommandService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class CallCommandServiceImpl implements CallCommandService {

    private final CallEventRepository callEventRepository;
    private final AuditService auditService;

    public CallCommandServiceImpl(CallEventRepository callEventRepository,
                                  AuditService auditService) {
        this.callEventRepository = callEventRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public CallEventEntity registerCall(RegisterCallCommand command, String requestId) {
        CallEventEntity entity = new CallEventEntity();
        entity.setDealerId(command.getDealerId());
        entity.setDealerCode(command.getDealerCode());
        entity.setDealerName(command.getDealerName());
        entity.setLeadId(command.getLeadId());
        entity.setKamId(command.getKamId());
        entity.setTlId(command.getTlId());
        entity.setPhone(command.getPhone());
        entity.setDirection(command.getDirection());
        entity.setCallDate(command.getCallDate() != null ? command.getCallDate() : LocalDate.now());
        entity.setCallStartTime(command.getCallStartTime() != null ? command.getCallStartTime() : Instant.now());
        entity.setNotes(command.getNotes());
        entity.setCreatedAt(Instant.now());

        CallEventEntity saved = callEventRepository.save(entity);

        auditService.log(
                command.getKamId(),
                "KAM",
                "CALL_REGISTER",
                "call_event",
                saved.getCallId().toString(),
                null,
                null,
                "Registered call to " + command.getDealerCode() + " (" + command.getPhone() + ")",
                requestId);

        return saved;
    }

    @Override
    @Transactional
    public CallEventEntity submitFeedback(UUID callId, SubmitCallFeedbackCommand command,
                                           UUID actorId, String actorRole, String requestId) {
        CallEventEntity entity = callEventRepository.findById(callId)
                .orElseThrow(() -> new ResourceNotFoundException("Call not found: " + callId));

        // Validate the actor owns this call (KAM) or has higher role
        if (!"ADMIN".equals(actorRole) && !"TL".equals(actorRole)
                && !actorId.equals(entity.getKamId())) {
            throw new ForbiddenException("Not authorized to submit feedback for this call");
        }

        String oldOutcome = entity.getOutcome();

        entity.setOutcome(command.getOutcome());
        entity.setCallStatus(command.getCallStatus());
        entity.setDispositionCode(command.getDispositionCode());
        entity.setIsProductive(command.getIsProductive());
        entity.setProductivitySource(command.getProductivitySource());
        entity.setKamComments(command.getKamComments());
        entity.setFollowUpTasks(command.getFollowUpTasks());
        entity.setNotes(command.getNotes());
        entity.setCallEndTime(command.getCallEndTime());
        entity.setDuration(command.getDuration());
        entity.setUpdatedAt(Instant.now());

        CallEventEntity saved = callEventRepository.save(entity);

        auditService.log(
                actorId,
                actorRole,
                "CALL_SUBMIT_FEEDBACK",
                "call_event",
                callId.toString(),
                oldOutcome != null ? "{\"outcome\":\"" + oldOutcome + "\"}" : null,
                "{\"outcome\":\"" + command.getOutcome() + "\"}",
                "Submitted feedback for call " + callId + ": " + command.getOutcome(),
                requestId);

        return saved;
    }
}
