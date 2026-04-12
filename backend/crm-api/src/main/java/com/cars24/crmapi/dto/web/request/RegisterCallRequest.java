package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterCallRequest {

    @NotBlank
    @JsonProperty("dealer_id")
    private String dealerId;

    @JsonProperty("dealer_code")
    private String dealerCode;

    @JsonProperty("dealer_name")
    private String dealerName;

    @JsonProperty("lead_id")
    private String leadId;

    @NotBlank
    private String phone;

    @NotBlank
    private String direction;

    @JsonProperty("call_date")
    private LocalDate callDate;

    @JsonProperty("call_start_time")
    private Instant callStartTime;

    private String notes;
}
