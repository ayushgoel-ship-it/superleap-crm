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
public class UpdateTargetRequest {

    @JsonProperty("si_target")
    private Integer siTarget;

    @JsonProperty("call_target")
    private Integer callTarget;

    @JsonProperty("visit_target")
    private Integer visitTarget;

    @JsonProperty("dcf_leads_target")
    private Integer dcfLeadsTarget;

    @JsonProperty("dcf_disbursal_target")
    private Integer dcfDisbursalTarget;

    @JsonProperty("revenue_target")
    private BigDecimal revenueTarget;
}
