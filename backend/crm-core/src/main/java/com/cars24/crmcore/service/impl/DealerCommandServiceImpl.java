package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.command.LocationUpdateCommand;
import com.cars24.crmcore.dto.command.LogUntaggedDealerCommand;
import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.entity.UntaggedDealerEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.DealerRepository;
import com.cars24.crmcore.repository.postgres.UntaggedDealerRepository;
import com.cars24.crmcore.service.internal.AuditService;
import com.cars24.crmcore.service.internal.DealerCommandService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class DealerCommandServiceImpl implements DealerCommandService {

    private final DealerRepository dealerRepository;
    private final UntaggedDealerRepository untaggedDealerRepository;
    private final AuditService auditService;

    public DealerCommandServiceImpl(DealerRepository dealerRepository,
                                    UntaggedDealerRepository untaggedDealerRepository,
                                    AuditService auditService) {
        this.dealerRepository = dealerRepository;
        this.untaggedDealerRepository = untaggedDealerRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public UntaggedDealerEntity logUntaggedDealer(LogUntaggedDealerCommand command, String requestId) {
        UntaggedDealerEntity entity = new UntaggedDealerEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setPhone(command.getPhone());
        entity.setName(command.getName());
        entity.setCity(command.getCity());
        entity.setRegion(command.getRegion());
        entity.setAddress(command.getAddress());
        entity.setNotes(command.getNotes());
        entity.setCreatedBy(command.getCreatedBy());
        entity.setCreatedAt(Instant.now());

        UntaggedDealerEntity saved = untaggedDealerRepository.save(entity);

        auditService.log(
                command.getCreatedBy(),
                "KAM",
                "DEALER_LOG_UNTAGGED",
                "untagged_dealer",
                saved.getId(),
                null,
                null,
                "Logged untagged dealer: " + command.getName() + " (" + command.getPhone() + ")",
                requestId);

        return saved;
    }

    @Override
    @Transactional
    public DealerEntity toggleTopTag(String dealerCode, UUID actorId, String actorRole, String requestId) {
        DealerEntity entity = dealerRepository.findByDealerCode(dealerCode)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found: " + dealerCode));

        Boolean oldIsTop = entity.getIsTop();
        Boolean newIsTop = oldIsTop != null && oldIsTop ? Boolean.FALSE : Boolean.TRUE;

        entity.setIsTop(newIsTop);
        entity.setUpdatedAt(Instant.now());

        DealerEntity saved = dealerRepository.save(entity);

        auditService.log(
                actorId,
                actorRole,
                "DEALER_TOGGLE_TOP_TAG",
                "dealers_master",
                dealerCode,
                "{\"is_top\":" + oldIsTop + "}",
                "{\"is_top\":" + newIsTop + "}",
                "Toggled top tag for dealer " + dealerCode + " to " + newIsTop,
                requestId);

        return saved;
    }

    @Override
    @Transactional
    public DealerEntity requestLocationUpdate(LocationUpdateCommand command,
                                              UUID actorId, String actorRole, String requestId) {
        DealerEntity entity = dealerRepository.findByDealerCode(command.getDealerCode())
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found: " + command.getDealerCode()));

        String oldAddress = entity.getAddress();

        if (command.getNewAddress() != null) entity.setAddress(command.getNewAddress());
        if (command.getNewCity() != null) entity.setCity(command.getNewCity());
        if (command.getNewRegion() != null) entity.setRegion(command.getNewRegion());
        entity.setUpdatedAt(Instant.now());

        DealerEntity saved = dealerRepository.save(entity);

        auditService.log(
                actorId,
                actorRole,
                "DEALER_LOCATION_UPDATE",
                "dealers_master",
                command.getDealerCode(),
                oldAddress != null ? "{\"address\":\"" + oldAddress + "\"}" : null,
                "{\"address\":\"" + command.getNewAddress() + "\"}",
                "Updated location for dealer " + command.getDealerCode() + ": " + command.getReason(),
                requestId);

        return saved;
    }
}
