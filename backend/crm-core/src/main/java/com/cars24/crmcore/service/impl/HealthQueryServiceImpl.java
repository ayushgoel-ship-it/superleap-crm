package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.service.internal.HealthQueryService;
import org.springframework.stereotype.Service;

@Service
public class HealthQueryServiceImpl implements HealthQueryService {

    @Override
    public String getHealthStatus() {
        return "OK";
    }
}
