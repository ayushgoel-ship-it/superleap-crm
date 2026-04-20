package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.SubmitDcfOnboardingRequest;
import com.cars24.crmcore.dto.command.SubmitDcfOnboardingCommand;
import com.cars24.crmcore.entity.DcfLeadEntity;
import com.cars24.crmcore.entity.DcfTimelineEventEntity;
import com.cars24.crmcore.service.internal.DcfCommandService;
import com.cars24.crmcore.service.internal.DcfQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/web/v1/dcf")
@Tag(name = "DCF", description = "Dealer Car Finance — onboarding, detail, timeline")
public class DcfController extends BaseController {

    private final DcfCommandService dcfCommandService;
    private final DcfQueryService dcfQueryService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public DcfController(DcfCommandService dcfCommandService,
                         DcfQueryService dcfQueryService,
                         ActorScopeResolver actorScopeResolver,
                         ApiResponseBuilder responseBuilder) {
        this.dcfCommandService = dcfCommandService;
        this.dcfQueryService = dcfQueryService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping("/{dcfId}")
    @Operation(summary = "Get DCF detail", description = "Full DCF loan application detail")
    @ApiResponse(responseCode = "200", description = "DCF detail retrieved")
    public ResponseEntity<ApiResponseEnvelope<DcfLeadEntity>> getDcfDetail(
            @PathVariable("dcfId") String dcfId) {

        DcfLeadEntity dcf = dcfQueryService.getDcfDetail(dcfId);
        return ResponseEntity.ok(responseBuilder.ok(dcf));
    }

    @GetMapping("/{dcfId}/timeline")
    @Operation(summary = "Get DCF timeline", description = "Chronological list of events for a DCF application")
    @ApiResponse(responseCode = "200", description = "Timeline retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<DcfTimelineEventEntity>>> getTimeline(
            @PathVariable("dcfId") String dcfId) {

        List<DcfTimelineEventEntity> events = dcfQueryService.getTimeline(dcfId);
        return ResponseEntity.ok(responseBuilder.ok(events));
    }

    @PostMapping("/onboard")
    @Operation(summary = "Submit DCF onboarding", description = "Create a new DCF loan application for a dealer")
    @ApiResponse(responseCode = "201", description = "DCF application created")
    public ResponseEntity<ApiResponseEnvelope<DcfLeadEntity>> submitOnboarding(
            @Valid @RequestBody SubmitDcfOnboardingRequest request) {

        UUID kamId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        SubmitDcfOnboardingCommand command = SubmitDcfOnboardingCommand.builder()
                .dealerCode(request.getDealerCode())
                .dealerCity(request.getDealerCity())
                .dealerAccount(request.getDealerAccount())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .pan(request.getPan())
                .regNo(request.getRegNo())
                .carValue(request.getCarValue())
                .loanAmount(request.getLoanAmount())
                .roi(request.getRoi())
                .tenure(request.getTenure())
                .kamId(kamId)
                .build();

        DcfLeadEntity created = dcfCommandService.submitOnboarding(command, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(created));
    }

}
