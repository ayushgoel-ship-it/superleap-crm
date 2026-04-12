package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.entity.TargetEntity;

import java.util.List;

public interface TargetQueryService {

    List<TargetEntity> listByPeriod(String period);

    List<TargetEntity> listByTeamAndPeriod(String teamId, String period);
}
