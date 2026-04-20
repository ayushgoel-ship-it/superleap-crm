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
public class SubmitDcfOnboardingRequest {

    @NotBlank
    @JsonProperty("dealer_code")
    private String dealerCode;

    @JsonProperty("dealer_city")
    private String dealerCity;

    @JsonProperty("dealer_account")
    private String dealerAccount;

    @NotBlank
    @JsonProperty("customer_name")
    private String customerName;

    @NotBlank
    @JsonProperty("customer_phone")
    private String customerPhone;

    private String pan;

    @JsonProperty("reg_no")
    private String regNo;

    @NotNull
    @JsonProperty("car_value")
    private BigDecimal carValue;

    @NotNull
    @JsonProperty("loan_amount")
    private BigDecimal loanAmount;

    private BigDecimal roi;

    private Integer tenure;
}
