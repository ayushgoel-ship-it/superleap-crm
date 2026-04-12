package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.DashboardSummary;
import java.util.UUID;

public interface DashboardQueryService {

    DashboardSummary getDashboardSummary(UUID userId, String role);
}
