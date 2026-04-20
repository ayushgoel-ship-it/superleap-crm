package com.cars24.crmcore.service.internal;

import com.cars24.crmcore.dto.command.BookAppointmentCommand;
import com.cars24.crmcore.entity.AppointmentEntity;

import java.util.UUID;

public interface AppointmentCommandService {

    AppointmentEntity bookAppointment(BookAppointmentCommand command, String requestId);

    AppointmentEntity rescheduleAppointment(String appointmentId, BookAppointmentCommand command,
                                             UUID actorId, String actorRole, String requestId);

    AppointmentEntity updateStatus(String appointmentId, String newStatus,
                                    UUID actorId, String actorRole, String requestId);
}
