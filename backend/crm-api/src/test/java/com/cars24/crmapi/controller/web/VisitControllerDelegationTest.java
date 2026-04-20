package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.dto.VisitListItem;
import com.cars24.crmcore.entity.VisitEntity;
import com.cars24.crmcore.service.internal.VisitCommandService;
import com.cars24.crmcore.service.internal.VisitQueryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class VisitControllerDelegationTest {

    @Mock private VisitQueryService visitQueryService;
    @Mock private VisitCommandService visitCommandService;

    private VisitController visitController;
    private MockMvc mockMvc;

    private static final UUID KAM_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        RequestContext ctx = RequestContext.builder()
                .authenticated(true)
                .effectiveActor(ActorContext.builder()
                        .userId(KAM_USER_ID.toString())
                        .roles(List.of("KAM"))
                        .permissions(List.of())
                        .tenantGroup("cars24")
                        .build())
                .actorScope(ActorScope.SELF)
                .metadata(AuthMetadata.builder().requestId("req-test").build())
                .build();
        CrmRequestContextHolder.set(ctx);

        RequestContextAccessor accessor = new RequestContextAccessor();
        ActorScopeResolver actorScopeResolver = new ActorScopeResolver(accessor);
        ApiResponseBuilder responseBuilder = new ApiResponseBuilder();

        visitController = new VisitController(visitQueryService, visitCommandService, actorScopeResolver, responseBuilder);
        mockMvc = MockMvcBuilders.standaloneSetup(visitController).build();
    }

    @AfterEach
    void tearDown() {
        CrmRequestContextHolder.clear();
    }

    @Test
    void list_delegatesWithKamIdAndDealerCode() throws Exception {
        PaginatedResponse<VisitListItem> serviceResult = PaginatedResponse.<VisitListItem>builder()
                .items(List.of()).page(0).pageSize(20).totalItems(0).totalPages(0)
                .build();
        when(visitQueryService.listVisits(eq(KAM_USER_ID), eq("DLR002"), any())).thenReturn(serviceResult);

        mockMvc.perform(get("/web/v1/visits").param("dealer_code", "DLR002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(visitQueryService).listVisits(eq(KAM_USER_ID), eq("DLR002"), any());
    }

    @Test
    void list_noFilters_passesNullDealerCode() throws Exception {
        PaginatedResponse<VisitListItem> serviceResult = PaginatedResponse.<VisitListItem>builder()
                .items(List.of()).page(0).pageSize(20).totalItems(0).totalPages(0)
                .build();
        when(visitQueryService.listVisits(eq(KAM_USER_ID), isNull(), any())).thenReturn(serviceResult);

        mockMvc.perform(get("/web/v1/visits"))
                .andExpect(status().isOk());

        verify(visitQueryService).listVisits(eq(KAM_USER_ID), isNull(), any());
    }

    @Test
    void startVisit_delegatesToCommandService() throws Exception {
        VisitEntity saved = new VisitEntity();
        saved.setVisitId(UUID.randomUUID());
        saved.setDealerId("DLR001");
        saved.setStatus("CHECKED_IN");

        when(visitCommandService.startVisit(any(), anyString())).thenReturn(saved);

        String json = """
                {
                    "dealer_id": "DLR001",
                    "dealer_code": "DC001",
                    "dealer_name": "Test Dealer",
                    "visit_type": "regular",
                    "geo_lat": 28.6139,
                    "geo_lng": 77.2090
                }
                """;

        mockMvc.perform(post("/web/v1/visits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CHECKED_IN"));

        verify(visitCommandService).startVisit(any(), anyString());
    }

    @Test
    void startVisit_missingRequiredFields_returns400() throws Exception {
        String json = """
                {
                    "notes": "missing required fields"
                }
                """;

        mockMvc.perform(post("/web/v1/visits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void completeVisit_delegatesToCommandService() throws Exception {
        UUID visitId = UUID.randomUUID();
        VisitEntity updated = new VisitEntity();
        updated.setVisitId(visitId);
        updated.setStatus("COMPLETED");
        updated.setIsProductive(true);

        when(visitCommandService.completeVisit(eq(visitId), any(), eq(KAM_USER_ID), eq("KAM"), anyString()))
                .thenReturn(updated);

        String json = """
                {
                    "is_productive": true,
                    "outcomes": "Discussed pricing",
                    "kam_comments": "Dealer interested in new models",
                    "checkout_lat": 28.6140,
                    "checkout_lng": 77.2091
                }
                """;

        mockMvc.perform(put("/web/v1/visits/{visitId}/complete", visitId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        verify(visitCommandService).completeVisit(eq(visitId), any(), eq(KAM_USER_ID), eq("KAM"), anyString());
    }
}
