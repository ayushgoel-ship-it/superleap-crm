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
public class BookAppointmentRequest {

    @NotBlank
    @JsonProperty("lead_id")
    private String leadId;

    @JsonProperty("c24_lead_id")
    private String c24LeadId;

    @NotBlank
    @JsonProperty("dealer_code")
    private String dealerCode;

    @JsonProperty("customer_name")
    private String customerName;

    @JsonProperty("customer_phone")
    private String customerPhone;

    @NotBlank
    @JsonProperty("appointment_type")
    private String appointmentType;

    @NotNull
    @JsonProperty("scheduled_date")
    private String scheduledDate;

    @JsonProperty("scheduled_time")
    private String scheduledTime;

    @JsonProperty("time_period")
    private String timePeriod;

    @JsonProperty("store_id")
    private String storeId;

    @JsonProperty("store_name")
    private String storeName;

    @JsonProperty("store_address")
    private String storeAddress;

    @JsonProperty("location_lat")
    private BigDecimal locationLat;

    @JsonProperty("location_lng")
    private BigDecimal locationLng;

    private String address;
    private String city;

    @JsonProperty("zone_id")
    private String zoneId;

    @JsonProperty("city_id")
    private String cityId;

    @JsonProperty("otp_verified")
    private boolean otpVerified;

    @JsonProperty("is_reschedule")
    private boolean isReschedule;
}
