package com.cars24.crmapi.dto.web.response;

import com.cars24.crmcore.entity.DealerEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class DealerDetailResponse {

    @JsonProperty("dealer_id")
    UUID dealerId;
    @JsonProperty("dealer_code")
    String dealerCode;
    @JsonProperty("dealer_name")
    String dealerName;
    String phone;
    String city;
    String region;
    String address;
    String segment;
    String status;
    @JsonProperty("kam_id")
    UUID kamId;
    @JsonProperty("tl_id")
    UUID tlId;
    @JsonProperty("sell_onboarded")
    String sellOnboarded;
    @JsonProperty("dcf_onboarded")
    String dcfOnboarded;
    @JsonProperty("bank_account_status")
    String bankAccountStatus;
    @JsonProperty("is_top")
    Boolean isTop;
    @JsonProperty("created_at")
    Instant createdAt;
    @JsonProperty("updated_at")
    Instant updatedAt;

    public static DealerDetailResponse fromEntity(DealerEntity e) {
        return DealerDetailResponse.builder()
                .dealerId(e.getDealerId())
                .dealerCode(e.getDealerCode())
                .dealerName(e.getDealerName())
                .phone(e.getPhone())
                .city(e.getCity())
                .region(e.getRegion())
                .address(e.getAddress())
                .segment(e.getSegment())
                .status(e.getStatus())
                .kamId(e.getKamId())
                .tlId(e.getTlId())
                .sellOnboarded(e.getSellOnboarded())
                .dcfOnboarded(e.getDcfOnboarded())
                .bankAccountStatus(e.getBankAccountStatus())
                .isTop(e.getIsTop())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
