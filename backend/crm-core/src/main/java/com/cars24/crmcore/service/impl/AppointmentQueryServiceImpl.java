package com.cars24.crmcore.service.impl;

import com.cars24.crmcore.dto.AppointmentListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.AppointmentEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.AppointmentRepository;
import com.cars24.crmcore.service.internal.AppointmentQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentQueryServiceImpl implements AppointmentQueryService {

    private final AppointmentRepository appointmentRepository;

    public AppointmentQueryServiceImpl(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public PaginatedResponse<AppointmentListItem> listAppointments(
            String kamId, String dealerCode, String leadId,
            String status, LocalDate fromDate, LocalDate toDate,
            Pageable pageable) {

        Page<AppointmentEntity> page = appointmentRepository.findFiltered(
                leadId, dealerCode, kamId, status, fromDate, toDate, pageable);

        List<AppointmentListItem> items = page.getContent().stream()
                .map(AppointmentListItem::fromEntity)
                .collect(Collectors.toList());

        return PaginatedResponse.<AppointmentListItem>builder()
                .items(items)
                .page(page.getNumber())
                .pageSize(page.getSize())
                .totalItems(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    public AppointmentEntity getAppointmentDetail(String appointmentId) {
        return appointmentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
    }

    @Override
    public List<AppointmentEntity> getAppointmentsByLeadId(String leadId) {
        return appointmentRepository.findByLeadId(leadId);
    }
}
