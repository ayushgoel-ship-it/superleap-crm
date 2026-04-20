package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.controller.support.PaginationHelper;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.BookAppointmentRequest;
import com.cars24.crmapi.dto.web.response.AppointmentDetailResponse;
import com.cars24.crmcore.dto.AppointmentListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.dto.command.BookAppointmentCommand;
import com.cars24.crmcore.entity.AppointmentEntity;
import com.cars24.crmcore.service.internal.AppointmentCommandService;
import com.cars24.crmcore.service.internal.AppointmentQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/web/v1/appointments")
@Tag(name = "Appointments", description = "Appointment booking, listing, and management")
public class AppointmentController extends BaseController {

    private final AppointmentQueryService appointmentQueryService;
    private final AppointmentCommandService appointmentCommandService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public AppointmentController(AppointmentQueryService appointmentQueryService,
                                  AppointmentCommandService appointmentCommandService,
                                  ActorScopeResolver actorScopeResolver,
                                  ApiResponseBuilder responseBuilder) {
        this.appointmentQueryService = appointmentQueryService;
        this.appointmentCommandService = appointmentCommandService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping
    @Operation(summary = "List appointments", description = "Paginated, filterable appointment list scoped by actor role")
    @ApiResponse(responseCode = "200", description = "Appointments retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<AppointmentListItem>>> list(
            @RequestParam(name = "dealer_code", required = false) String dealerCode,
            @RequestParam(name = "lead_id", required = false) String leadId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "from_date", required = false) String fromDate,
            @RequestParam(name = "to_date", required = false) String toDate,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "page_size", required = false) Integer pageSize) {

        Pageable pageable = PaginationHelper.toPageable(page, pageSize);
        LocalDate from = fromDate != null ? LocalDate.parse(fromDate) : null;
        LocalDate to = toDate != null ? LocalDate.parse(toDate) : null;

        PaginatedResponse<AppointmentListItem> result = appointmentQueryService.listAppointments(
                actorScopeResolver.getKamIdStringForScope(),
                dealerCode, leadId, status, from, to, pageable);

        return ResponseEntity.ok(responseBuilder.okPaginated(result));
    }

    @GetMapping("/{appointmentId}")
    @Operation(summary = "Get appointment detail")
    @ApiResponse(responseCode = "200", description = "Appointment detail retrieved")
    public ResponseEntity<ApiResponseEnvelope<AppointmentDetailResponse>> detail(
            @PathVariable("appointmentId") String appointmentId) {

        AppointmentEntity entity = appointmentQueryService.getAppointmentDetail(appointmentId);
        return ResponseEntity.ok(responseBuilder.ok(AppointmentDetailResponse.fromEntity(entity)));
    }

    @PostMapping
    @Operation(summary = "Book appointment", description = "Book a new inspection appointment")
    @ApiResponse(responseCode = "201", description = "Appointment booked")
    public ResponseEntity<ApiResponseEnvelope<AppointmentDetailResponse>> book(
            @Valid @RequestBody BookAppointmentRequest request) {

        UUID kamId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        BookAppointmentCommand command = BookAppointmentCommand.builder()
                .leadId(request.getLeadId())
                .c24LeadId(request.getC24LeadId())
                .dealerCode(request.getDealerCode())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .appointmentType(request.getAppointmentType())
                .scheduledDate(LocalDate.parse(request.getScheduledDate()))
                .scheduledTime(request.getScheduledTime())
                .timePeriod(request.getTimePeriod())
                .storeId(request.getStoreId())
                .storeName(request.getStoreName())
                .storeAddress(request.getStoreAddress())
                .locationLat(request.getLocationLat())
                .locationLng(request.getLocationLng())
                .address(request.getAddress())
                .city(request.getCity())
                .zoneId(request.getZoneId())
                .cityId(request.getCityId())
                .otpVerified(request.isOtpVerified())
                .isReschedule(request.isReschedule())
                .kamId(kamId)
                .build();

        AppointmentEntity created = appointmentCommandService.bookAppointment(command, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(AppointmentDetailResponse.fromEntity(created)));
    }

    @PutMapping("/{appointmentId}/reschedule")
    @Operation(summary = "Reschedule appointment")
    @ApiResponse(responseCode = "200", description = "Appointment rescheduled")
    public ResponseEntity<ApiResponseEnvelope<AppointmentDetailResponse>> reschedule(
            @PathVariable("appointmentId") String appointmentId,
            @Valid @RequestBody BookAppointmentRequest request) {

        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String actorRole = actorScopeResolver.getEffectiveRole();
        String requestId = resolveRequestId();

        BookAppointmentCommand command = BookAppointmentCommand.builder()
                .leadId(request.getLeadId())
                .c24LeadId(request.getC24LeadId())
                .dealerCode(request.getDealerCode())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .appointmentType(request.getAppointmentType())
                .scheduledDate(LocalDate.parse(request.getScheduledDate()))
                .scheduledTime(request.getScheduledTime())
                .timePeriod(request.getTimePeriod())
                .storeId(request.getStoreId())
                .storeName(request.getStoreName())
                .storeAddress(request.getStoreAddress())
                .locationLat(request.getLocationLat())
                .locationLng(request.getLocationLng())
                .address(request.getAddress())
                .city(request.getCity())
                .zoneId(request.getZoneId())
                .cityId(request.getCityId())
                .otpVerified(request.isOtpVerified())
                .isReschedule(true)
                .build();

        AppointmentEntity rescheduled = appointmentCommandService.rescheduleAppointment(
                appointmentId, command, actorId, actorRole, requestId);

        return ResponseEntity.ok(responseBuilder.ok(AppointmentDetailResponse.fromEntity(rescheduled)));
    }

    @PutMapping("/{appointmentId}/status")
    @Operation(summary = "Update appointment status")
    @ApiResponse(responseCode = "200", description = "Status updated")
    public ResponseEntity<ApiResponseEnvelope<AppointmentDetailResponse>> updateStatus(
            @PathVariable("appointmentId") String appointmentId,
            @RequestBody java.util.Map<String, String> body) {

        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String actorRole = actorScopeResolver.getEffectiveRole();
        String requestId = resolveRequestId();
        String newStatus = body.getOrDefault("status", "");

        AppointmentEntity updated = appointmentCommandService.updateStatus(
                appointmentId, newStatus, actorId, actorRole, requestId);

        return ResponseEntity.ok(responseBuilder.ok(AppointmentDetailResponse.fromEntity(updated)));
    }
}
