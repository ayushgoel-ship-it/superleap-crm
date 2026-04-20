package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.controller.support.PaginationHelper;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmapi.dto.web.request.CreateLeadRequest;
import com.cars24.crmapi.dto.web.request.UpdateLeadPricingRequest;
import com.cars24.crmapi.dto.web.response.LeadDetailResponse;
import com.cars24.crmcore.dto.LeadListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.dto.command.CreateLeadCommand;
import com.cars24.crmcore.dto.command.UpdateLeadPricingCommand;
import com.cars24.crmcore.entity.LeadEntity;
import com.cars24.crmcore.service.internal.LeadCommandService;
import com.cars24.crmcore.service.internal.LeadQueryService;
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
@RequestMapping("/web/v1/leads")
@Tag(name = "Leads", description = "Lead lifecycle — create, list, detail, pricing")
public class LeadController extends BaseController {

    private final LeadQueryService leadQueryService;
    private final LeadCommandService leadCommandService;
    private final ActorScopeResolver actorScopeResolver;
    private final ApiResponseBuilder responseBuilder;

    public LeadController(LeadQueryService leadQueryService,
                          LeadCommandService leadCommandService,
                          ActorScopeResolver actorScopeResolver,
                          ApiResponseBuilder responseBuilder) {
        this.leadQueryService = leadQueryService;
        this.leadCommandService = leadCommandService;
        this.actorScopeResolver = actorScopeResolver;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping
    @Operation(summary = "List leads", description = "Paginated, filterable lead list scoped by actor role")
    @ApiResponse(responseCode = "200", description = "Leads retrieved")
    public ResponseEntity<ApiResponseEnvelope<List<LeadListItem>>> list(
            @RequestParam(name = "dealer_code", required = false) String dealerCode,
            @RequestParam(name = "channel", required = false) String channel,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "stage", required = false) String stage,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "page_size", required = false) Integer pageSize) {

        Pageable pageable = PaginationHelper.toPageable(page, pageSize);

        PaginatedResponse<LeadListItem> result = leadQueryService.listLeads(
                actorScopeResolver.getKamIdStringForScope(),
                dealerCode, channel, status, stage, search, pageable);

        return ResponseEntity.ok(responseBuilder.okPaginated(result));
    }

    @PostMapping
    @Operation(summary = "Create lead", description = "Register a new sell lead for the current KAM")
    @ApiResponse(responseCode = "201", description = "Lead created")
    public ResponseEntity<ApiResponseEnvelope<LeadEntity>> createLead(
            @Valid @RequestBody CreateLeadRequest request) {

        UUID kamId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String requestId = resolveRequestId();

        CreateLeadCommand command = CreateLeadCommand.builder()
                .dealerCode(request.getDealerCode())
                .dealerName(request.getDealerName())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .channel(request.getChannel())
                .leadType(request.getLeadType())
                .make(request.getMake())
                .model(request.getModel())
                .year(request.getYear())
                .city(request.getCity())
                .region(request.getRegion())
                .kamId(kamId)
                .build();

        LeadEntity created = leadCommandService.createLead(command, requestId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseBuilder.ok(created));
    }

    @GetMapping("/{leadId}")
    @Operation(summary = "Get lead detail", description = "Full lead detail including pricing and timeline dates")
    @ApiResponse(responseCode = "200", description = "Lead detail retrieved")
    public ResponseEntity<ApiResponseEnvelope<LeadDetailResponse>> detail(
            @PathVariable("leadId") String leadId) {

        LeadEntity lead = leadQueryService.getLeadDetail(leadId);
        LeadDetailResponse response = LeadDetailResponse.fromEntity(lead);

        return ResponseEntity.ok(responseBuilder.ok(response));
    }

    @PutMapping("/{leadId}/pricing")
    @Operation(summary = "Update lead pricing", description = "Update CEP and pricing confidence for a lead")
    @ApiResponse(responseCode = "200", description = "Pricing updated")
    public ResponseEntity<ApiResponseEnvelope<LeadEntity>> updatePricing(
            @PathVariable("leadId") String leadId,
            @Valid @RequestBody UpdateLeadPricingRequest request) {

        UUID actorId = actorScopeResolver.getEffectiveUserIdAsUuid();
        String actorRole = actorScopeResolver.getEffectiveRole();
        String requestId = resolveRequestId();

        UpdateLeadPricingCommand command = UpdateLeadPricingCommand.builder()
                .cep(request.getCep())
                .cepConfidence(request.getCepConfidence())
                .build();

        LeadEntity updated = leadCommandService.updatePricing(
                leadId, command, actorId, actorRole, requestId);

        return ResponseEntity.ok(responseBuilder.ok(updated));
    }

}
