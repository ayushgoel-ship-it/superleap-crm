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
public class LocationUpdateRequest {

    @NotBlank
    @JsonProperty("dealer_code")
    private String dealerCode;

    @JsonProperty("new_address")
    private String newAddress;

    @JsonProperty("new_city")
    private String newCity;

    @JsonProperty("new_region")
    private String newRegion;

    private String reason;
}
