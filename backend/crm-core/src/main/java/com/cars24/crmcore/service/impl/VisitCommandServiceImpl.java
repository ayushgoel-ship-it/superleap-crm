package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.command.CompleteVisitCommand;
import com.cars24.crmcore.dto.command.StartVisitCommand;
import com.cars24.crmcore.entity.VisitEntity;
import com.cars24.crmcore.event.NotificationRequestedEvent;
import com.cars24.crmcore.exception.ForbiddenException;
import com.cars24.crmcore.exception.IllegalStateTransitionException;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.VisitRepository;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.VisitCommandService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class VisitCommandServiceImpl implements VisitCommandService {

    private final VisitRepository visitRepository;
    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;

    public VisitCommandServiceImpl(VisitRepository visitRepository,
                                   AuditService auditService,
                                   ApplicationEventPublisher eventPublisher) {
        this.visitRepository = visitRepository;
        this.auditService = auditService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public VisitEntity startVisit(StartVisitCommand command, String requestId) {
        VisitEntity entity = new VisitEntity();
        entity.setDealerId(command.getDealerId());
        entity.setDealerCode(command.getDealerCode());
        entity.setDealerName(command.getDealerName());
        entity.setUntaggedDealerId(command.getUntaggedDealerId());
        entity.setKamId(command.getKamId());
        entity.setTlId(command.getTlId());
        entity.setVisitType(command.getVisitType());
        entity.setVisitDate(LocalDate.now());
        entity.setStatus("CHECKED_IN");
        entity.setGeoLat(command.getGeoLat());
        entity.setGeoLng(command.getGeoLng());
        entity.setCheckInAt(Instant.now());
        entity.setNotes(command.getNotes());
        entity.setCreatedAt(Instant.now());

        VisitEntity saved = visitRepository.save(entity);

        auditService.log(
                command.getKamId(),
                "KAM",
                "VISIT_START",
                "visit",
                saved.getVisitId().toString(),
                null,
                null,
                "Started " + command.getVisitType() + " visit to " + command.getDealerCode(),
                requestId);

        return saved;
    }

    @Override
    @Transactional
    public VisitEntity completeVisit(UUID visitId, CompleteVisitCommand command,
                                     UUID actorId, String actorRole, String requestId) {
        VisitEntity entity = visitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Visit not found: " + visitId));

        // Validate the actor owns this visit (KAM) or has higher role
        if (!"ADMIN".equals(actorRole) && !"TL".equals(actorRole)
                && !actorId.equals(entity.getKamId())) {
            throw new ForbiddenException("Not authorized to complete this visit");
        }

        // Validate status transition: only CHECKED_IN can be completed
        if (!"CHECKED_IN".equals(entity.getStatus())) {
            throw new IllegalStateTransitionException(
                    "Cannot complete visit in status '" + entity.getStatus() + "'. Expected: CHECKED_IN");
        }

        String oldStatus = entity.getStatus();

        entity.setStatus("COMPLETED");
        entity.setIsProductive(command.getIsProductive());
        entity.setProductivitySource(command.getProductivitySource());
        entity.setOutcomes(command.getOutcomes());
        entity.setKamComments(command.getKamComments());
        entity.setFollowUpTasks(command.getFollowUpTasks());
        entity.setFeedback(command.getFeedback());
        entity.setNotes(command.getNotes());
        entity.setCheckoutLat(command.getCheckoutLat());
        entity.setCheckoutLng(command.getCheckoutLng());
        entity.setCompletedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());

        // Calculate duration if check-in time is available
        if (entity.getCheckInAt() != null) {
            long durationSeconds = Duration.between(entity.getCheckInAt(), entity.getCompletedAt()).getSeconds();
            entity.setDuration((int) durationSeconds);
        }

        VisitEntity saved = visitRepository.save(entity);

        auditService.log(
                actorId,
                actorRole,
                "VISIT_COMPLETE",
                "visit",
                visitId.toString(),
                "{\"status\":\"" + oldStatus + "\"}",
                "{\"status\":\"COMPLETED\",\"is_productive\":" + command.getIsProductive() + "}",
                "Completed visit " + visitId,
                requestId);

        // Notify TL about completed visit
        if (entity.getTlId() != null) {
            eventPublisher.publishEvent(new NotificationRequestedEvent(
                    this, actorId, entity.getTlId().toString(),
                    "VISIT_COMPLETED", "Visit Completed",
                    "Visit " + visitId + " to " + entity.getDealerCode() + " completed",
                    "visits", visitId.toString()));
        }

        return saved;
    }
}
