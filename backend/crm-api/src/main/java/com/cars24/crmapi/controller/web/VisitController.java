package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.controller.support.PaginationHelper;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.CompleteVisitRequest;
import com.cars24.crmapi.dto.web.request.StartVisitRequest;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.dto.VisitListItem;
import com.cars24.crmcore.dto.command.CompleteVisitCommand;
import com.cars24.crmcore.dto.command.StartVisitCommand;
import com.cars24.crmcore.entity.VisitEntity;
import com.cars24.crmcore.service.internal.VisitCommandService;
import com.cars24.crmcore.service.internal.VisitQueryService;
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
@RequestMapping("/web/v1/visits")
@Tag(name = "Visits", description = "Field visits — start, list, complete")
public class VisitController extends BaseController {

    private final VisitQueryService visitQueryService;
    private final VisitCommandService visitCommandService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public VisitController(VisitQueryService visitQueryService,
                           VisitCommandService visitCommandService,
                           ActorScopeResolver actorScopeResolver,
                           ApiResponseBuilder responseBuilder) {
        this.visitQueryService = visitQueryService;
        this.visitCommandService = visitCommandService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping
    @Operation(summary = "List visits", description = "Paginated field visit list filtered by dealer")
    @ApiResponse(responseCode = "200", description = "Visits retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<VisitListItem>>> list(
            @RequestParam(name = "dealer_code", required = false) String dealerCode,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "page_size", required = false) Integer pageSize) {

        Pageable pageable = PaginationHelper.toPageable(page, pageSize);

        PaginatedResponse<VisitListItem> result = visitQueryService.listVisits(
                actorScopeResolver.getKamIdForScope(), dealerCode, pageable);

        return ResponseEntity.ok(responseBuilder.okPaginated(result));
    }

    @PostMapping
    @Operation(summary = "Start visit", description = "Check in to a dealer visit with geo-location")
    @ApiResponse(responseCode = "201", description = "Visit started")
    public ResponseEntity<ApiResponseEnvelope<VisitEntity>> startVisit(
            @Valid @RequestBody StartVisitRequest request) {

        UUID kamId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        StartVisitCommand command = StartVisitCommand.builder()
                .dealerId(request.getDealerId())
                .dealerCode(request.getDealerCode())
                .dealerName(request.getDealerName())
                .untaggedDealerId(request.getUntaggedDealerId())
                .kamId(kamId)
                .visitType(request.getVisitType())
                .geoLat(request.getGeoLat())
                .geoLng(request.getGeoLng())
                .notes(request.getNotes())
                .build();

        VisitEntity created = visitCommandService.startVisit(command, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(created));
    }

    @PutMapping("/{visitId}/complete")
    @Operation(summary = "Complete visit", description = "Check out from a visit with outcomes and feedback")
    @ApiResponse(responseCode = "200", description = "Visit completed")
    public ResponseEntity<ApiResponseEnvelope<VisitEntity>> completeVisit(
            @PathVariable("visitId") UUID visitId,
            @Valid @RequestBody CompleteVisitRequest request) {

        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String actorRole = actorScopeResolver.getEffectiveRole();
        String requestId = resolveRequestId();

        CompleteVisitCommand command = CompleteVisitCommand.builder()
                .isProductive(request.getIsProductive())
                .productivitySource(request.getProductivitySource())
                .outcomes(request.getOutcomes())
                .kamComments(request.getKamComments())
                .followUpTasks(request.getFollowUpTasks())
                .feedback(request.getFeedback())
                .notes(request.getNotes())
                .checkoutLat(request.getCheckoutLat())
                .checkoutLng(request.getCheckoutLng())
                .build();

        VisitEntity updated = visitCommandService.completeVisit(
                visitId, command, actorId, actorRole, requestId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }

}
