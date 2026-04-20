package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.command.BookAppointmentCommand;
import com.cars24.crmcore.entity.AppointmentEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.AppointmentRepository;
import com.cars24.crmcore.service.internal.AppointmentCommandService;
import com.cars24.crmcore.service.internal.AuditService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AppointmentCommandServiceImpl implements AppointmentCommandService {

    private final AppointmentRepository appointmentRepository;
    private final AuditService auditService;
    private final Counter appointmentsCreatedCounter;
    private final Counter appointmentsRescheduledCounter;

    public AppointmentCommandServiceImpl(AppointmentRepository appointmentRepository,
                                          AuditService auditService,
                                          MeterRegistry meterRegistry) {
        this.appointmentRepository = appointmentRepository;
        this.auditService = auditService;
        this.appointmentsCreatedCounter = Counter.builder("crm.appointments.created")
                .description("Number of appointments booked").register(meterRegistry);
        this.appointmentsRescheduledCounter = Counter.builder("crm.appointments.rescheduled")
                .description("Number of appointments rescheduled").register(meterRegistry);
    }

    @Override
    @Transactional
    public AppointmentEntity bookAppointment(BookAppointmentCommand command, String requestId) {
        String generatedId = "APPT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        AppointmentEntity entity = new AppointmentEntity();
        entity.setAppointmentId(generatedId);
        entity.setLeadId(command.getLeadId());
        entity.setC24LeadId(command.getC24LeadId());
        entity.setDealerCode(command.getDealerCode());
        entity.setCustomerName(command.getCustomerName());
        entity.setCustomerPhone(command.getCustomerPhone());
        entity.setAppointmentType(command.getAppointmentType());
        entity.setStatus("SCHEDULED");
        entity.setScheduledDate(command.getScheduledDate());
        entity.setScheduledTime(command.getScheduledTime());
        entity.setTimePeriod(command.getTimePeriod());
        entity.setStoreId(command.getStoreId());
        entity.setStoreName(command.getStoreName());
        entity.setStoreAddress(command.getStoreAddress());
        entity.setLocationLat(command.getLocationLat());
        entity.setLocationLng(command.getLocationLng());
        entity.setAddress(command.getAddress());
        entity.setCity(command.getCity());
        entity.setZoneId(command.getZoneId());
        entity.setCityId(command.getCityId());
        entity.setOtpVerified(command.isOtpVerified());
        entity.setIsReschedule(command.isReschedule());
        entity.setRescheduledFrom(command.getRescheduledFrom());
        entity.setKamId(command.getKamId() != null ? command.getKamId().toString() : null);
        entity.setTlId(command.getTlId());
        entity.setCreatedAt(Instant.now());

        AppointmentEntity saved = appointmentRepository.save(entity);
        appointmentsCreatedCounter.increment();

        auditService.log(
                command.getKamId(),
                "KAM",
                "APPOINTMENT_BOOK",
                "appointments",
                generatedId,
                null,
                null,
                "Booked " + command.getAppointmentType() + " appointment for lead " + command.getLeadId()
                        + " on " + command.getScheduledDate(),
                requestId);

        return saved;
    }

    @Override
    @Transactional
    public AppointmentEntity rescheduleAppointment(String appointmentId, BookAppointmentCommand command,
                                                    UUID actorId, String actorRole, String requestId) {
        AppointmentEntity original = appointmentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        // Mark original as rescheduled
        original.setStatus("RESCHEDULED");
        original.setUpdatedAt(Instant.now());
        appointmentRepository.save(original);

        // Create new appointment linked to original
        BookAppointmentCommand rescheduledCommand = BookAppointmentCommand.builder()
                .leadId(command.getLeadId())
                .c24LeadId(command.getC24LeadId())
                .dealerCode(command.getDealerCode())
                .customerName(command.getCustomerName())
                .customerPhone(command.getCustomerPhone())
                .appointmentType(command.getAppointmentType())
                .scheduledDate(command.getScheduledDate())
                .scheduledTime(command.getScheduledTime())
                .timePeriod(command.getTimePeriod())
                .storeId(command.getStoreId())
                .storeName(command.getStoreName())
                .storeAddress(command.getStoreAddress())
                .locationLat(command.getLocationLat())
                .locationLng(command.getLocationLng())
                .address(command.getAddress())
                .city(command.getCity())
                .zoneId(command.getZoneId())
                .cityId(command.getCityId())
                .otpVerified(command.isOtpVerified())
                .isReschedule(true)
                .rescheduledFrom(original.getId())
                .kamId(actorId)
                .tlId(command.getTlId())
                .build();

        AppointmentEntity rescheduled = bookAppointment(rescheduledCommand, requestId);
        appointmentsRescheduledCounter.increment();

        auditService.log(
                actorId,
                actorRole,
                "APPOINTMENT_RESCHEDULE",
                "appointments",
                rescheduled.getAppointmentId(),
                "{\"from\":\"" + appointmentId + "\"}",
                null,
                "Rescheduled appointment from " + appointmentId + " to " + rescheduled.getAppointmentId(),
                requestId);

        return rescheduled;
    }

    @Override
    @Transactional
    public AppointmentEntity updateStatus(String appointmentId, String newStatus,
                                           UUID actorId, String actorRole, String requestId) {
        AppointmentEntity entity = appointmentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        String oldStatus = entity.getStatus();
        entity.setStatus(newStatus);
        entity.setUpdatedAt(Instant.now());

        AppointmentEntity saved = appointmentRepository.save(entity);

        auditService.log(
                actorId,
                actorRole,
                "APPOINTMENT_STATUS_UPDATE",
                "appointments",
                appointmentId,
                "{\"status\":\"" + oldStatus + "\"}",
                "{\"status\":\"" + newStatus + "\"}",
                "Updated appointment " + appointmentId + " status from " + oldStatus + " to " + newStatus,
                requestId);

        return saved;
    }
}
