package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteVisitRequest {

    @JsonProperty("is_productive")
    private Boolean isProductive;

    @JsonProperty("productivity_source")
    private String productivitySource;

    private String outcomes;

    @JsonProperty("kam_comments")
    private String kamComments;

    @JsonProperty("follow_up_tasks")
    private String followUpTasks;

    private String feedback;

    private String notes;

    @JsonProperty("checkout_lat")
    private BigDecimal checkoutLat;

    @JsonProperty("checkout_lng")
    private BigDecimal checkoutLng;
}
