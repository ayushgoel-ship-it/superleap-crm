package com.cars24.crmapi.dto.web.response;

import com.cars24.crmcore.entity.AppointmentEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Value
@Builder
public class AppointmentDetailResponse {

    UUID id;
    @JsonProperty("appointment_id")
    String appointmentId;
    @JsonProperty("lead_id")
    String leadId;
    @JsonProperty("c24_lead_id")
    String c24LeadId;
    @JsonProperty("dealer_code")
    String dealerCode;
    @JsonProperty("customer_name")
    String customerName;
    @JsonProperty("customer_phone")
    String customerPhone;
    @JsonProperty("appointment_type")
    String appointmentType;
    String status;
    @JsonProperty("scheduled_date")
    LocalDate scheduledDate;
    @JsonProperty("scheduled_time")
    String scheduledTime;
    @JsonProperty("time_period")
    String timePeriod;
    @JsonProperty("store_id")
    String storeId;
    @JsonProperty("store_name")
    String storeName;
    @JsonProperty("store_address")
    String storeAddress;
    @JsonProperty("location_lat")
    BigDecimal locationLat;
    @JsonProperty("location_lng")
    BigDecimal locationLng;
    String address;
    String city;
    @JsonProperty("otp_verified")
    Boolean otpVerified;
    @JsonProperty("is_reschedule")
    Boolean isReschedule;
    @JsonProperty("rescheduled_from")
    UUID rescheduledFrom;
    @JsonProperty("kam_id")
    String kamId;
    @JsonProperty("tl_id")
    String tlId;
    @JsonProperty("created_at")
    Instant createdAt;
    @JsonProperty("updated_at")
    Instant updatedAt;

    public static AppointmentDetailResponse fromEntity(AppointmentEntity e) {
        return AppointmentDetailResponse.builder()
                .id(e.getId())
                .appointmentId(e.getAppointmentId())
                .leadId(e.getLeadId())
                .c24LeadId(e.getC24LeadId())
                .dealerCode(e.getDealerCode())
                .customerName(e.getCustomerName())
                .customerPhone(e.getCustomerPhone())
                .appointmentType(e.getAppointmentType())
                .status(e.getStatus())
                .scheduledDate(e.getScheduledDate())
                .scheduledTime(e.getScheduledTime())
                .timePeriod(e.getTimePeriod())
                .storeId(e.getStoreId())
                .storeName(e.getStoreName())
                .storeAddress(e.getStoreAddress())
                .locationLat(e.getLocationLat())
                .locationLng(e.getLocationLng())
                .address(e.getAddress())
                .city(e.getCity())
                .otpVerified(e.getOtpVerified())
                .isReschedule(e.getIsReschedule())
                .rescheduledFrom(e.getRescheduledFrom())
                .kamId(e.getKamId())
                .tlId(e.getTlId())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
