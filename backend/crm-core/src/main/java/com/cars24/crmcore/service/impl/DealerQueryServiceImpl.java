package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.DealerListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.DealerRepository;
import com.cars24.crmcore.service.internal.DealerQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class DealerQueryServiceImpl implements DealerQueryService {

    private final DealerRepository dealerRepository;

    public DealerQueryServiceImpl(DealerRepository dealerRepository) {
        this.dealerRepository = dealerRepository;
    }

    @Override
    public PaginatedResponse<DealerListItem> listDealers(UUID kamId, UUID tlId, String segment, String status, String search, Pageable pageable) {
        Page<DealerEntity> page = dealerRepository.findFiltered(kamId, tlId, segment, status, search, pageable);

        return PaginatedResponse.<DealerListItem>builder()
                .items(page.getContent().stream().map(this::toListItem).toList())
                .page(page.getNumber())
                .pageSize(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    public DealerEntity getDealerDetail(String dealerCode) {
        DealerEntity dealer = dealerRepository.findByDealerCode(dealerCode)
                .orElseThrow(() -> new ResourceNotFoundException("Dealer not found: " + dealerCode));
        return dealer;
    }

    private DealerListItem toListItem(DealerEntity e) {
        return DealerListItem.builder()
                .dealerId(e.getDealerId())
                .dealerCode(e.getDealerCode())
                .dealerName(e.getDealerName())
                .city(e.getCity())
                .region(e.getRegion())
                .segment(e.getSegment())
                .status(e.getStatus())
                .isTop(Boolean.TRUE.equals(e.getIsTop()))
                .build();
    }
}
