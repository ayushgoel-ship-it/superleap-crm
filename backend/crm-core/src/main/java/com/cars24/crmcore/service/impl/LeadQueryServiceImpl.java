package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.LeadListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.LeadEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.LeadRepository;
import com.cars24.crmcore.service.internal.LeadQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class LeadQueryServiceImpl implements LeadQueryService {

    private final LeadRepository leadRepository;

    public LeadQueryServiceImpl(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @Override
    public PaginatedResponse<LeadListItem> listLeads(String kamId, String dealerCode, String channel, String status, String stage, String search, Pageable pageable) {
        Page<LeadEntity> page = leadRepository.findFiltered(dealerCode, kamId, channel, status, stage, search, pageable);

        return PaginatedResponse.<LeadListItem>builder()
                .items(page.getContent().stream().map(this::toListItem).toList())
                .page(page.getNumber())
                .pageSize(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    public LeadEntity getLeadDetail(String leadId) {
        return leadRepository.findByLeadId(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + leadId));
    }

    private LeadListItem toListItem(LeadEntity e) {
        return LeadListItem.builder()
                .id(e.getId())
                .leadId(e.getLeadId())
                .customerName(e.getCustomerName())
                .channel(e.getChannel())
                .stage(e.getStage())
                .status(e.getStatus())
                .ragStatus(e.getRagStatus())
                .dealerCode(e.getDealerCode())
                .dealerName(e.getDealerName())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
