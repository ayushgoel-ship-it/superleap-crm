package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.config.CacheConfig;
import com.cars24.crmcore.entity.TargetEntity;
import com.cars24.crmcore.repository.postgres.TargetRepository;
import com.cars24.crmcore.service.internal.TargetQueryService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TargetQueryServiceImpl implements TargetQueryService {

    private final TargetRepository targetRepository;

    public TargetQueryServiceImpl(TargetRepository targetRepository) {
        this.targetRepository = targetRepository;
    }

    @Override
    @Cacheable(value = CacheConfig.CACHE_TARGETS, key = "#period")
    public List<TargetEntity> listByPeriod(String period) {
        return targetRepository.findByPeriod(period);
    }

    @Override
    public List<TargetEntity> listByTeamAndPeriod(String teamId, String period) {
        return targetRepository.findByTeamIdAndPeriod(teamId, period);
    }
}
