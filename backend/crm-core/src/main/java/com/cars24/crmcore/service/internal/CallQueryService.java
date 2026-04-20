package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.CallListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface CallQueryService {

    PaginatedResponse<CallListItem> listCalls(UUID kamId, String dealerCode, Pageable pageable);
}
