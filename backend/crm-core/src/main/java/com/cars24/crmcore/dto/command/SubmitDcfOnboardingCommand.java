package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.UUID;

@Value
@Builder
public class SubmitDcfOnboardingCommand {
    String dealerCode;
    String dealerCity;
    String dealerAccount;
    String customerName;
    String customerPhone;
    String pan;
    String regNo;
    BigDecimal carValue;
    BigDecimal loanAmount;
    BigDecimal roi;
    Integer tenure;
    UUID kamId;
    String kamName;
    String tlId;
}
