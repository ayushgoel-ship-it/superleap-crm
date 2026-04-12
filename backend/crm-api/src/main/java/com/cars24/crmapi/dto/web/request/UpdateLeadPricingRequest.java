package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class UpdateLeadPricingRequest {

    @NotNull
    private BigDecimal cep;

    @JsonProperty("cep_confidence")
    private String cepConfidence;
}
