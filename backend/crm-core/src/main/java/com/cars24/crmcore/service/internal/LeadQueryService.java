package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.LeadListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.LeadEntity;
import org.springframework.data.domain.Pageable;

public interface LeadQueryService {

    PaginatedResponse<LeadListItem> listLeads(String kamId, String dealerCode, String channel, String status, String stage, String search, Pageable pageable);

    LeadEntity getLeadDetail(String leadId);
}
