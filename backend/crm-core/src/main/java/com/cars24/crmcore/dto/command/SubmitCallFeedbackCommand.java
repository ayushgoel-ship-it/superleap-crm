package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class SubmitCallFeedbackCommand {
    String outcome;
    String callStatus;
    String dispositionCode;
    Boolean isProductive;
    String productivitySource;
    String kamComments;
    String followUpTasks;
    String notes;
    Instant callEndTime;
    Integer duration;
}
