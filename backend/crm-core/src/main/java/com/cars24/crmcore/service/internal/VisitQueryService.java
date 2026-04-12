package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.dto.VisitListItem;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface VisitQueryService {

    PaginatedResponse<VisitListItem> listVisits(UUID kamId, String dealerCode, Pageable pageable);
}
