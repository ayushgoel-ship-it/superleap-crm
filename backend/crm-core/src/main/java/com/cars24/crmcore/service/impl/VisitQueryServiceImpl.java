package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.dto.VisitListItem;
import com.cars24.crmcore.entity.VisitEntity;
import com.cars24.crmcore.repository.postgres.VisitRepository;
import com.cars24.crmcore.service.internal.VisitQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class VisitQueryServiceImpl implements VisitQueryService {

    private final VisitRepository visitRepository;

    public VisitQueryServiceImpl(VisitRepository visitRepository) {
        this.visitRepository = visitRepository;
    }

    @Override
    public PaginatedResponse<VisitListItem> listVisits(UUID kamId, String dealerCode, Pageable pageable) {
        Page<VisitEntity> page;
        if (kamId != null) {
            page = visitRepository.findByKamId(kamId, pageable);
        } else {
            page = visitRepository.findAll(pageable);
        }

        return PaginatedResponse.<VisitListItem>builder()
                .items(page.getContent().stream().map(this::toListItem).toList())
                .page(page.getNumber())
                .pageSize(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    private VisitListItem toListItem(VisitEntity e) {
        return VisitListItem.builder()
                .visitId(e.getVisitId())
                .dealerCode(e.getDealerCode())
                .dealerName(e.getDealerName())
                .visitType(e.getVisitType())
                .status(e.getStatus())
                .duration(e.getDuration())
                .isProductive(e.getIsProductive())
                .visitDate(e.getVisitDate())
                .checkInAt(e.getCheckInAt())
                .build();
    }
}
