package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.CallListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.CallEventEntity;
import com.cars24.crmcore.repository.postgres.CallEventRepository;
import com.cars24.crmcore.service.internal.CallQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CallQueryServiceImpl implements CallQueryService {

    private final CallEventRepository callEventRepository;

    public CallQueryServiceImpl(CallEventRepository callEventRepository) {
        this.callEventRepository = callEventRepository;
    }

    @Override
    public PaginatedResponse<CallListItem> listCalls(UUID kamId, String dealerCode, Pageable pageable) {
        Page<CallEventEntity> page;
        if (kamId != null) {
            page = callEventRepository.findByKamId(kamId, pageable);
        } else {
            page = callEventRepository.findAll(pageable);
        }

        return PaginatedResponse.<CallListItem>builder()
                .items(page.getContent().stream().map(this::toListItem).toList())
                .page(page.getNumber())
                .pageSize(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    private CallListItem toListItem(CallEventEntity e) {
        return CallListItem.builder()
                .callId(e.getCallId())
                .dealerCode(e.getDealerCode())
                .dealerName(e.getDealerName())
                .outcome(e.getOutcome())
                .callStatus(e.getCallStatus())
                .duration(e.getDuration())
                .isProductive(e.getIsProductive())
                .callDate(e.getCallDate())
                .callStartTime(e.getCallStartTime())
                .build();
    }
}
