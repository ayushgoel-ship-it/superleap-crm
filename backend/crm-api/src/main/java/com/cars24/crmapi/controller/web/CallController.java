package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.controller.support.PaginationHelper;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.RegisterCallRequest;
import com.cars24.crmapi.dto.web.request.SubmitCallFeedbackRequest;
import com.cars24.crmcore.dto.CallListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.dto.command.RegisterCallCommand;
import com.cars24.crmcore.dto.command.SubmitCallFeedbackCommand;
import com.cars24.crmcore.entity.CallEventEntity;
import com.cars24.crmcore.service.internal.CallCommandService;
import com.cars24.crmcore.service.internal.CallQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/web/v1/calls")
@Tag(name = "Calls", description = "Call events — register, list, feedback")
public class CallController extends BaseController {

    private final CallQueryService callQueryService;
    private final CallCommandService callCommandService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public CallController(CallQueryService callQueryService,
                          CallCommandService callCommandService,
                          ActorScopeResolver actorScopeResolver,
                          ApiResponseBuilder responseBuilder) {
        this.callQueryService = callQueryService;
        this.callCommandService = callCommandService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping
    @Operation(summary = "List calls", description = "Paginated call event list filtered by dealer")
    @ApiResponse(responseCode = "200", description = "Calls retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<CallListItem>>> list(
            @RequestParam(name = "dealer_code", required = false) String dealerCode,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "page_size", required = false) Integer pageSize) {

        Pageable pageable = PaginationHelper.toPageable(page, pageSize);

        PaginatedResponse<CallListItem> result = callQueryService.listCalls(
                actorScopeResolver.getKamIdForScope(), dealerCode, pageable);

        return ResponseEntity.ok(responseBuilder.okPaginated(result));
    }

    @PostMapping
    @Operation(summary = "Register call", description = "Log a new call event for a dealer or lead")
    @ApiResponse(responseCode = "201", description = "Call registered")
    public ResponseEntity<ApiResponseEnvelope<CallEventEntity>> register(
            @Valid @RequestBody RegisterCallRequest request) {

        UUID kamId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        RegisterCallCommand command = RegisterCallCommand.builder()
                .dealerId(request.getDealerId())
                .dealerCode(request.getDealerCode())
                .dealerName(request.getDealerName())
                .leadId(request.getLeadId())
                .kamId(kamId)
                .phone(request.getPhone())
                .direction(request.getDirection())
                .callDate(request.getCallDate())
                .callStartTime(request.getCallStartTime())
                .notes(request.getNotes())
                .build();

        CallEventEntity created = callCommandService.registerCall(command, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(created));
    }

    @PutMapping("/{callId}/feedback")
    @Operation(summary = "Submit call feedback", description = "Add outcome, disposition, and notes to a call")
    @ApiResponse(responseCode = "200", description = "Feedback submitted")
    public ResponseEntity<ApiResponseEnvelope<CallEventEntity>> submitFeedback(
            @PathVariable("callId") UUID callId,
            @Valid @RequestBody SubmitCallFeedbackRequest request) {

        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String actorRole = actorScopeResolver.getEffectiveRole();
        String requestId = resolveRequestId();

        SubmitCallFeedbackCommand command = SubmitCallFeedbackCommand.builder()
                .outcome(request.getOutcome())
                .callStatus(request.getCallStatus())
                .dispositionCode(request.getDispositionCode())
                .isProductive(request.getIsProductive())
                .productivitySource(request.getProductivitySource())
                .kamComments(request.getKamComments())
                .followUpTasks(request.getFollowUpTasks())
                .notes(request.getNotes())
                .callEndTime(request.getCallEndTime())
                .duration(request.getDuration())
                .build();

        CallEventEntity updated = callCommandService.submitFeedback(
                callId, command, actorId, actorRole, requestId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }

}
