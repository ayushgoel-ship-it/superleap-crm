package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.controller.support.PaginationHelper;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.LocationUpdateRequest;
import com.cars24.crmapi.dto.web.request.LogUntaggedDealerRequest;
import com.cars24.crmapi.dto.web.response.DealerDetailResponse;
import com.cars24.crmcore.dto.DealerListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.dto.command.LocationUpdateCommand;
import com.cars24.crmcore.dto.command.LogUntaggedDealerCommand;
import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.entity.UntaggedDealerEntity;
import com.cars24.crmcore.service.internal.DealerCommandService;
import com.cars24.crmcore.service.internal.DealerQueryService;
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
@RequestMapping("/web/v1/dealers")
@Tag(name = "Dealers", description = "Dealer portfolio — list, detail, untagged, top-tag, location")
public class DealerController extends BaseController {

    private final DealerQueryService dealerQueryService;
    private final DealerCommandService dealerCommandService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public DealerController(DealerQueryService dealerQueryService,
                            DealerCommandService dealerCommandService,
                            ActorScopeResolver actorScopeResolver,
                            ApiResponseBuilder responseBuilder) {
        this.dealerQueryService = dealerQueryService;
        this.dealerCommandService = dealerCommandService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping
    @Operation(summary = "List dealers", description = "Paginated dealer list filtered by segment, status, and search")
    @ApiResponse(responseCode = "200", description = "Dealers retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<DealerListItem>>> list(
            @RequestParam(name = "segment", required = false) String segment,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "page_size", required = false) Integer pageSize) {

        Pageable pageable = PaginationHelper.toPageable(page, pageSize);

        PaginatedResponse<DealerListItem> result = dealerQueryService.listDealers(
                actorScopeResolver.getKamIdForScope(),
                actorScopeResolver.getTlIdForScope(),
                segment, status, search, pageable);

        return ResponseEntity.ok(responseBuilder.okPaginated(result));
    }

    @GetMapping("/{dealerCode}")
    @Operation(summary = "Get dealer detail", description = "Full dealer profile including contacts and segments")
    @ApiResponse(responseCode = "200", description = "Dealer detail retrieved")
    public ResponseEntity<ApiResponseEnvelope<DealerDetailResponse>> detail(
            @PathVariable("dealerCode") String dealerCode) {

        DealerEntity dealer = dealerQueryService.getDealerDetail(dealerCode);
        DealerDetailResponse response = DealerDetailResponse.fromEntity(dealer);

        return ResponseEntity.ok(responseBuilder.ok(response));
    }

    @PostMapping("/untagged")
    @Operation(summary = "Log untagged dealer", description = "Record a dealer not yet in the system")
    @ApiResponse(responseCode = "201", description = "Untagged dealer logged")
    public ResponseEntity<ApiResponseEnvelope<UntaggedDealerEntity>> logUntaggedDealer(
            @Valid @RequestBody LogUntaggedDealerRequest request) {

        UUID kamId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        LogUntaggedDealerCommand command = LogUntaggedDealerCommand.builder()
                .phone(request.getPhone())
                .name(request.getName())
                .city(request.getCity())
                .region(request.getRegion())
                .address(request.getAddress())
                .notes(request.getNotes())
                .createdBy(kamId)
                .build();

        UntaggedDealerEntity created = dealerCommandService.logUntaggedDealer(command, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(created));
    }

    @PutMapping("/{dealerCode}/top-tag")
    @Operation(summary = "Toggle top-tag", description = "Mark or unmark a dealer as top-tagged")
    @ApiResponse(responseCode = "200", description = "Top-tag toggled")
    public ResponseEntity<ApiResponseEnvelope<DealerEntity>> toggleTopTag(
            @PathVariable("dealerCode") String dealerCode) {

        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String actorRole = actorScopeResolver.getEffectiveRole();
        String requestId = resolveRequestId();

        DealerEntity updated = dealerCommandService.toggleTopTag(
                dealerCode, actorId, actorRole, requestId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }

    @PostMapping("/location-request")
    @Operation(summary = "Request location update", description = "Submit a request to change dealer location")
    @ApiResponse(responseCode = "201", description = "Location update requested")
    public ResponseEntity<ApiResponseEnvelope<DealerEntity>> requestLocationUpdate(
            @Valid @RequestBody LocationUpdateRequest request) {

        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String actorRole = actorScopeResolver.getEffectiveRole();
        String requestId = resolveRequestId();

        LocationUpdateCommand command = LocationUpdateCommand.builder()
                .dealerCode(request.getDealerCode())
                .newAddress(request.getNewAddress())
                .newCity(request.getNewCity())
                .newRegion(request.getNewRegion())
                .reason(request.getReason())
                .build();

        DealerEntity updated = dealerCommandService.requestLocationUpdate(
                command, actorId, actorRole, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(updated));
    }

}
