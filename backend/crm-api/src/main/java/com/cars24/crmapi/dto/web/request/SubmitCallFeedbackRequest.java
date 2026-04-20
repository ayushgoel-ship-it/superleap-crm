package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitCallFeedbackRequest {

    @NotBlank
    private String outcome;

    @JsonProperty("call_status")
    private String callStatus;

    @JsonProperty("disposition_code")
    private String dispositionCode;

    @JsonProperty("is_productive")
    private Boolean isProductive;

    @JsonProperty("productivity_source")
    private String productivitySource;

    @JsonProperty("kam_comments")
    private String kamComments;

    @JsonProperty("follow_up_tasks")
    private String followUpTasks;

    private String notes;

    @JsonProperty("call_end_time")
    private Instant callEndTime;

    private Integer duration;
}
