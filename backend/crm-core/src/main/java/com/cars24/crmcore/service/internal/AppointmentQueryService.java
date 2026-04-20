package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.AppointmentListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.AppointmentEntity;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentQueryService {

    PaginatedResponse<AppointmentListItem> listAppointments(
            String kamId, String dealerCode, String leadId,
            String status, LocalDate fromDate, LocalDate toDate,
            Pageable pageable);

    AppointmentEntity getAppointmentDetail(String appointmentId);

    List<AppointmentEntity> getAppointmentsByLeadId(String leadId);
}
