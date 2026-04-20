package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.command.SubmitDcfOnboardingCommand;
import com.cars24.crmcore.entity.DcfLeadEntity;
import com.cars24.crmcore.entity.DcfTimelineEventEntity;
import com.cars24.crmcore.event.NotificationRequestedEvent;
import com.cars24.crmcore.repository.postgres.DcfLeadRepository;
import com.cars24.crmcore.repository.postgres.DcfTimelineEventRepository;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.DcfCommandService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class DcfCommandServiceImpl implements DcfCommandService {

    private final DcfLeadRepository dcfLeadRepository;
    private final DcfTimelineEventRepository dcfTimelineEventRepository;
    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;
    private final Counter dcfOnboardingCounter;

    public DcfCommandServiceImpl(DcfLeadRepository dcfLeadRepository,
                                  DcfTimelineEventRepository dcfTimelineEventRepository,
                                  AuditService auditService,
                                  ApplicationEventPublisher eventPublisher,
                                  MeterRegistry meterRegistry) {
        this.dcfLeadRepository = dcfLeadRepository;
        this.dcfTimelineEventRepository = dcfTimelineEventRepository;
        this.auditService = auditService;
        this.eventPublisher = eventPublisher;
        this.dcfOnboardingCounter = Counter.builder("crm.dcf.onboarding_submitted")
                .description("Number of DCF onboarding submissions").register(meterRegistry);
    }

    @Override
    @Transactional
    public DcfLeadEntity submitOnboarding(SubmitDcfOnboardingCommand command, String requestId) {
        String dcfId = "DCF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        DcfLeadEntity entity = new DcfLeadEntity();
        entity.setDcfId(dcfId);
        entity.setDealerCode(command.getDealerCode());
        entity.setDealerCity(command.getDealerCity());
        entity.setDealerAccount(command.getDealerAccount());
        entity.setCustomerName(command.getCustomerName());
        entity.setCustomerPhone(command.getCustomerPhone());
        entity.setPan(command.getPan());
        entity.setRegNo(command.getRegNo());
        entity.setCarValue(command.getCarValue());
        entity.setLoanAmount(command.getLoanAmount());
        entity.setRoi(command.getRoi());
        entity.setTenure(command.getTenure());
        entity.setKamId(command.getKamId() != null ? command.getKamId().toString() : null);
        entity.setKamName(command.getKamName());
        entity.setTlId(command.getTlId());
        entity.setCurrentFunnel("application");
        entity.setOverallStatus("active");
        entity.setCreatedAt(Instant.now());

        DcfLeadEntity saved = dcfLeadRepository.save(entity);
        dcfOnboardingCounter.increment();

        // Create timeline event
        DcfTimelineEventEntity timelineEvent = new DcfTimelineEventEntity();
        timelineEvent.setDcfId(dcfId);
        timelineEvent.setEventType("ONBOARDING_SUBMITTED");
        timelineEvent.setEventPayload("{\"customerName\":\"" + command.getCustomerName() + "\"}");
        timelineEvent.setActorUserId(command.getKamId());
        timelineEvent.setCreatedAt(Instant.now());
        dcfTimelineEventRepository.save(timelineEvent);

        // Audit trail
        auditService.log(command.getKamId(), "KAM", "DCF_ONBOARDING_SUBMIT",
                "dcf_leads_master", dcfId, null, null,
                "DCF onboarding submitted for customer " + command.getCustomerName(),
                requestId);

        // Notify TL about new DCF onboarding
        if (command.getTlId() != null) {
            eventPublisher.publishEvent(new NotificationRequestedEvent(
                    this, command.getKamId(), command.getTlId(),
                    "DCF_ONBOARDING", "DCF Onboarding Submitted",
                    "DCF " + dcfId + " submitted for " + command.getCustomerName(),
                    "dcf_leads", dcfId));
        }

        return saved;
    }
}
