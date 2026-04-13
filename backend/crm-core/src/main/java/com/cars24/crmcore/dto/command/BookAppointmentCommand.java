package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Command for booking or rescheduling a C24 appointment.
 *
 * <p>After the C24 partners-lead API confirms the booking, the backend
 * persists the appointment in the local appointments table.</p>
 */
@Value
@Builder
public class BookAppointmentCommand {

    String leadId;
    String c24LeadId;
    String dealerCode;
    String customerName;
    String customerPhone;

    // ── Appointment details ──
    String appointmentType;       // STORE or HOME
    LocalDate scheduledDate;
    String scheduledTime;
    String timePeriod;            // morning, afternoon, evening

    // ── Store info (if STORE type) ──
    String storeId;
    String storeName;
    String storeAddress;

    // ── Location ──
    BigDecimal locationLat;
    BigDecimal locationLng;
    String address;
    String city;
    String zoneId;
    String cityId;

    // ── Verification ──
    boolean otpVerified;
    boolean isReschedule;
    UUID rescheduledFrom;

    // ── Actor ──
    UUID kamId;
    String tlId;
}
