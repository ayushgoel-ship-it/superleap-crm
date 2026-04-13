package com.cars24.crmcore.dto;

import com.cars24.crmcore.entity.AppointmentEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Value
@Builder
public class AppointmentListItem {

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
    @JsonProperty("appointment_type")
    String appointmentType;
    String status;
    @JsonProperty("scheduled_date")
    LocalDate scheduledDate;
    @JsonProperty("scheduled_time")
    String scheduledTime;
    @JsonProperty("store_name")
    String storeName;
    String city;
    @JsonProperty("otp_verified")
    Boolean otpVerified;
    @JsonProperty("is_reschedule")
    Boolean isReschedule;
    @JsonProperty("created_at")
    Instant createdAt;

    public static AppointmentListItem fromEntity(AppointmentEntity e) {
        return AppointmentListItem.builder()
                .id(e.getId())
                .appointmentId(e.getAppointmentId())
                .leadId(e.getLeadId())
                .c24LeadId(e.getC24LeadId())
                .dealerCode(e.getDealerCode())
                .customerName(e.getCustomerName())
                .appointmentType(e.getAppointmentType())
                .status(e.getStatus())
                .scheduledDate(e.getScheduledDate())
                .scheduledTime(e.getScheduledTime())
                .storeName(e.getStoreName())
                .city(e.getCity())
                .otpVerified(e.getOtpVerified())
                .isReschedule(e.getIsReschedule())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
