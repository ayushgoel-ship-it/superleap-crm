package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.command.CreateLeadCommand;
import com.cars24.crmcore.dto.command.UpdateLeadPricingCommand;
import com.cars24.crmcore.entity.LeadEntity;
import com.cars24.crmcore.event.NotificationRequestedEvent;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.LeadRepository;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.LeadCommandService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class LeadCommandServiceImpl implements LeadCommandService {

    private final LeadRepository leadRepository;
    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;
    private final Counter leadsCreatedCounter;
    private final Counter leadsPricingUpdatedCounter;

    public LeadCommandServiceImpl(LeadRepository leadRepository,
                                  AuditService auditService,
                                  ApplicationEventPublisher eventPublisher,
                                  MeterRegistry meterRegistry) {
        this.leadRepository = leadRepository;
        this.auditService = auditService;
        this.eventPublisher = eventPublisher;
        this.leadsCreatedCounter = Counter.builder("crm.leads.created")
                .description("Number of leads created").register(meterRegistry);
        this.leadsPricingUpdatedCounter = Counter.builder("crm.leads.pricing_updated")
                .description("Number of lead pricing updates").register(meterRegistry);
    }

    @Override
    @Transactional
    public LeadEntity createLead(CreateLeadCommand command, String requestId) {
        String generatedLeadId = "LEAD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        LeadEntity entity = new LeadEntity();
        entity.setLeadId(generatedLeadId);
        entity.setDealerCode(command.getDealerCode());
        entity.setDealerName(command.getDealerName());
        entity.setCustomerName(command.getCustomerName());
        entity.setCustomerPhone(command.getCustomerPhone());
        entity.setChannel(command.getChannel());
        entity.setLeadType(command.getLeadType());
        entity.setMake(command.getMake());
        entity.setModel(command.getModel());
        entity.setYear(command.getYear());
        entity.setCity(command.getCity());
        entity.setRegion(command.getRegion());
        entity.setKamId(command.getKamId() != null ? command.getKamId().toString() : null);
        entity.setTlId(command.getTlId());
        entity.setStatus("open");
        entity.setStage("new");
        entity.setCreatedAt(Instant.now());

        LeadEntity saved = leadRepository.save(entity);
        leadsCreatedCounter.increment();

        auditService.log(
                command.getKamId(),
                "KAM",
                "LEAD_CREATE",
                "sell_leads_master",
                generatedLeadId,
                null,
                null,
                "Created lead for " + command.getCustomerName() + " at " + command.getDealerCode(),
                requestId);

        // Notify TL if available
        if (command.getTlId() != null) {
            eventPublisher.publishEvent(new NotificationRequestedEvent(
                    this, command.getKamId(), command.getTlId(),
                    "LEAD_CREATED", "New Lead Created",
                    "Lead " + generatedLeadId + " created for " + command.getCustomerName(),
                    "leads", generatedLeadId));
        }

        return saved;
    }

    @Override
    @Transactional
    public LeadEntity updatePricing(String leadId, UpdateLeadPricingCommand command,
                                    UUID actorId, String actorRole, String requestId) {
        LeadEntity entity = leadRepository.findByLeadId(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + leadId));

        String oldCep = entity.getCep() != null ? entity.getCep().toPlainString() : null;

        entity.setCep(command.getCep());
        entity.setCepConfidence(command.getCepConfidence());
        entity.setUpdatedAt(Instant.now());

        LeadEntity saved = leadRepository.save(entity);
        leadsPricingUpdatedCounter.increment();

        auditService.log(
                actorId,
                actorRole,
                "LEAD_UPDATE_PRICING",
                "sell_leads_master",
                leadId,
                oldCep != null ? "{\"cep\":\"" + oldCep + "\"}" : null,
                "{\"cep\":\"" + command.getCep() + "\",\"cep_confidence\":\"" + command.getCepConfidence() + "\"}",
                "Updated pricing for lead " + leadId,
                requestId);

        return saved;
    }
}
