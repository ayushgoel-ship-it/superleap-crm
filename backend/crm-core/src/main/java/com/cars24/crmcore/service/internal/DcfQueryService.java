package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.entity.DcfLeadEntity;
import com.cars24.crmcore.entity.DcfTimelineEventEntity;

import java.util.List;

public interface DcfQueryService {

    DcfLeadEntity getDcfDetail(String dcfId);

    List<DcfTimelineEventEntity> getTimeline(String dcfId);
}
