package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.DealerListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.DealerEntity;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface DealerQueryService {

    PaginatedResponse<DealerListItem> listDealers(UUID kamId, UUID tlId, String segment, String status, String search, Pageable pageable);

    DealerEntity getDealerDetail(String dealerCode);
}
