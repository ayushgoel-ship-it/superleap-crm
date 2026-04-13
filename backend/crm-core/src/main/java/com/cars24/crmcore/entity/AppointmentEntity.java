package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "appointment_id", unique = true)
    private String appointmentId;

    @Column(name = "lead_id", nullable = false)
    private String leadId;

    @Column(name = "c24_lead_id")
    private String c24LeadId;

    @Column(name = "dealer_code")
    private String dealerCode;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "appointment_type")
    private String appointmentType;

    @Column(name = "status")
    private String status;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time")
    private String scheduledTime;

    @Column(name = "time_period")
    private String timePeriod;

    @Column(name = "store_id")
    private String storeId;

    @Column(name = "store_name")
    private String storeName;

    @Column(name = "store_address")
    private String storeAddress;

    @Column(name = "location_lat")
    private BigDecimal locationLat;

    @Column(name = "location_lng")
    private BigDecimal locationLng;

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "zone_id")
    private String zoneId;

    @Column(name = "city_id")
    private String cityId;

    @Column(name = "otp_verified")
    private Boolean otpVerified;

    @Column(name = "is_reschedule")
    private Boolean isReschedule;

    @Column(name = "rescheduled_from")
    private UUID rescheduledFrom;

    @Column(name = "kam_id")
    private String kamId;

    @Column(name = "tl_id")
    private String tlId;

    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
