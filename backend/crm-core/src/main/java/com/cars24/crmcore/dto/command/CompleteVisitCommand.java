package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class CompleteVisitCommand {
    Boolean isProductive;
    String productivitySource;
    String outcomes;
    String kamComments;
    String followUpTasks;
    String feedback;
    String notes;
    BigDecimal checkoutLat;
    BigDecimal checkoutLng;
}
