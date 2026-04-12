package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.command.LocationUpdateCommand;
import com.cars24.crmcore.dto.command.LogUntaggedDealerCommand;
import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.entity.UntaggedDealerEntity;

import java.util.UUID;

public interface DealerCommandService {

    UntaggedDealerEntity logUntaggedDealer(LogUntaggedDealerCommand command, String requestId);

    DealerEntity toggleTopTag(String dealerCode, UUID actorId, String actorRole, String requestId);

    DealerEntity requestLocationUpdate(LocationUpdateCommand command,
                                       UUID actorId, String actorRole, String requestId);
}
