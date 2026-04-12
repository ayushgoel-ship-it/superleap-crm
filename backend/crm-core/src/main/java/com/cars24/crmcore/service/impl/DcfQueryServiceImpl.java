package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.entity.DcfLeadEntity;
import com.cars24.crmcore.entity.DcfTimelineEventEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.DcfLeadRepository;
import com.cars24.crmcore.repository.postgres.DcfTimelineEventRepository;
import com.cars24.crmcore.service.internal.DcfQueryService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DcfQueryServiceImpl implements DcfQueryService {

    private final DcfLeadRepository dcfLeadRepository;
    private final DcfTimelineEventRepository timelineRepository;

    public DcfQueryServiceImpl(DcfLeadRepository dcfLeadRepository,
                               DcfTimelineEventRepository timelineRepository) {
        this.dcfLeadRepository = dcfLeadRepository;
        this.timelineRepository = timelineRepository;
    }

    @Override
    public DcfLeadEntity getDcfDetail(String dcfId) {
        return dcfLeadRepository.findByDcfId(dcfId)
                .orElseThrow(() -> new ResourceNotFoundException("DCF lead not found: " + dcfId));
    }

    @Override
    public List<DcfTimelineEventEntity> getTimeline(String dcfId) {
        return timelineRepository.findByDcfIdOrderByCreatedAtDesc(dcfId);
    }
}
