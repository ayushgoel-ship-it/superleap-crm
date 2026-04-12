package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartVisitRequest {

    @NotBlank
    @JsonProperty("dealer_id")
    private String dealerId;

    @JsonProperty("dealer_code")
    private String dealerCode;

    @JsonProperty("dealer_name")
    private String dealerName;

    @JsonProperty("untagged_dealer_id")
    private String untaggedDealerId;

    @NotBlank
    @JsonProperty("visit_type")
    private String visitType;

    @NotNull
    @JsonProperty("geo_lat")
    private BigDecimal geoLat;

    @NotNull
    @JsonProperty("geo_lng")
    private BigDecimal geoLng;

    private String notes;
}
