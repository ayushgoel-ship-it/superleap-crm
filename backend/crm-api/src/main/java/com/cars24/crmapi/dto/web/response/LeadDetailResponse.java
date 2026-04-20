package com.cars24.crmapi.dto.web.response;

import com.cars24.crmcore.entity.LeadEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class LeadDetailResponse {

    UUID id;
    @JsonProperty("lead_id")
    String leadId;
    @JsonProperty("dealer_code")
    String dealerCode;
    @JsonProperty("customer_name")
    String customerName;
    @JsonProperty("customer_phone")
    String customerPhone;
    String channel;
    @JsonProperty("lead_type")
    String leadType;
    String stage;
    String status;
    @JsonProperty("rag_status")
    String ragStatus;
    String make;
    String model;
    String year;
    String variant;
    @JsonProperty("reg_no")
    String regNo;
    String city;
    String region;
    BigDecimal cep;
    @JsonProperty("cep_confidence")
    String cepConfidence;
    @JsonProperty("c24_quote")
    BigDecimal c24Quote;
    @JsonProperty("max_c24_quote")
    BigDecimal maxC24Quote;
    @JsonProperty("target_price")
    BigDecimal targetPrice;
    @JsonProperty("expected_revenue")
    BigDecimal expectedRevenue;
    @JsonProperty("actual_revenue")
    BigDecimal actualRevenue;
    // ── C24 integration ──
    @JsonProperty("c24_lead_id")
    String c24LeadId;
    @JsonProperty("c24_lead_status")
    String c24LeadStatus;
    @JsonProperty("external_source")
    String externalSource;
    @JsonProperty("fuel_type")
    String fuelType;
    String transmission;
    String ownership;
    String kilometers;

    @JsonProperty("kam_id")
    String kamId;
    @JsonProperty("tl_id")
    String tlId;
    @JsonProperty("created_at")
    Instant createdAt;
    @JsonProperty("updated_at")
    Instant updatedAt;

    @JsonProperty("dealer_snapshot")
    DealerSnapshot dealerSnapshot;

    @Value
    @Builder
    public static class DealerSnapshot {
        @JsonProperty("dealer_code")
        String dealerCode;
        @JsonProperty("dealer_name")
        String dealerName;
    }

    public static LeadDetailResponse fromEntity(LeadEntity e) {
        return LeadDetailResponse.builder()
                .id(e.getId())
                .leadId(e.getLeadId())
                .dealerCode(e.getDealerCode())
                .customerName(e.getCustomerName())
                .customerPhone(e.getCustomerPhone())
                .channel(e.getChannel())
                .leadType(e.getLeadType())
                .stage(e.getStage())
                .status(e.getStatus())
                .ragStatus(e.getRagStatus())
                .make(e.getMake())
                .model(e.getModel())
                .year(e.getYear())
                .variant(e.getVariant())
                .regNo(e.getRegNo())
                .city(e.getCity())
                .region(e.getRegion())
                .cep(e.getCep())
                .cepConfidence(e.getCepConfidence())
                .c24Quote(e.getC24Quote())
                .maxC24Quote(e.getMaxC24Quote())
                .targetPrice(e.getTargetPrice())
                .expectedRevenue(e.getExpectedRevenue())
                .actualRevenue(e.getActualRevenue())
                .c24LeadId(e.getC24LeadId())
                .c24LeadStatus(e.getC24LeadStatus())
                .externalSource(e.getExternalSource())
                .fuelType(e.getFuelType())
                .transmission(e.getTransmission())
                .ownership(e.getOwnership())
                .kilometers(e.getKilometers())
                .kamId(e.getKamId())
                .tlId(e.getTlId())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .dealerSnapshot(DealerSnapshot.builder()
                        .dealerCode(e.getDealerCode())
                        .dealerName(e.getDealerName())
                        .build())
                .build();
    }
}
