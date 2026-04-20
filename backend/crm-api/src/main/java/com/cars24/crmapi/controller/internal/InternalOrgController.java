package com.cars24.crmapi.controller.internal;

import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmapi.dto.common.ApiResponseEnvelope;
import com.cars24.crmcore.dto.OrgHierarchyDto;
import com.cars24.crmcore.service.internal.OrgQueryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/v1/org")
@Tag(name = "Internal — Org", description = "Service-to-service org hierarchy sync")
public class InternalOrgController {

    private final OrgQueryService orgQueryService;
    private final ApiResponseBuilder responseBuilder;

    public InternalOrgController(OrgQueryService orgQueryService,
                                 ApiResponseBuilder responseBuilder) {
        this.orgQueryService = orgQueryService;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping("/hierarchy")
    public ResponseEntity<ApiResponseEnvelope<OrgHierarchyDto>> hierarchy() {
        OrgHierarchyDto hierarchy = orgQueryService.getOrgHierarchy();
        return ResponseEntity.ok(responseBuilder.ok(hierarchy));
    }
}
