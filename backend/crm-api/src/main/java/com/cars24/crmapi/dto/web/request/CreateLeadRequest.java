package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeadRequest {

    @NotBlank
    @JsonProperty("dealer_code")
    private String dealerCode;

    @JsonProperty("dealer_name")
    private String dealerName;

    @NotBlank
    @JsonProperty("customer_name")
    private String customerName;

    @NotBlank
    @JsonProperty("customer_phone")
    private String customerPhone;

    @NotBlank
    private String channel;

    @JsonProperty("lead_type")
    private String leadType;

    private String make;
    private String model;
    private String year;
    private String city;
    private String region;
}
