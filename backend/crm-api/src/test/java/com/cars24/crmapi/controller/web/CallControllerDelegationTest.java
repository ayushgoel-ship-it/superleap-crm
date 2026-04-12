package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.dto.CallListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.CallEventEntity;
import com.cars24.crmcore.service.internal.CallCommandService;
import com.cars24.crmcore.service.internal.CallQueryService;
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
class CallControllerDelegationTest {

    @Mock private CallQueryService callQueryService;
    @Mock private CallCommandService callCommandService;

    private CallController callController;
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

        callController = new CallController(callQueryService, callCommandService, actorScopeResolver, responseBuilder);
        mockMvc = MockMvcBuilders.standaloneSetup(callController).build();
    }

    @AfterEach
    void tearDown() {
        CrmRequestContextHolder.clear();
    }

    @Test
    void list_delegatesWithKamIdAndDealerCode() throws Exception {
        PaginatedResponse<CallListItem> serviceResult = PaginatedResponse.<CallListItem>builder()
                .items(List.of()).page(0).pageSize(20).totalItems(0).totalPages(0)
                .build();
        when(callQueryService.listCalls(eq(KAM_USER_ID), eq("DLR001"), any())).thenReturn(serviceResult);

        mockMvc.perform(get("/web/v1/calls").param("dealer_code", "DLR001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(callQueryService).listCalls(eq(KAM_USER_ID), eq("DLR001"), any());
    }

    @Test
    void list_noFilters_passesNullDealerCode() throws Exception {
        PaginatedResponse<CallListItem> serviceResult = PaginatedResponse.<CallListItem>builder()
                .items(List.of()).page(0).pageSize(20).totalItems(0).totalPages(0)
                .build();
        when(callQueryService.listCalls(eq(KAM_USER_ID), isNull(), any())).thenReturn(serviceResult);

        mockMvc.perform(get("/web/v1/calls"))
                .andExpect(status().isOk());

        verify(callQueryService).listCalls(eq(KAM_USER_ID), isNull(), any());
    }

    @Test
    void register_delegatesToCommandService() throws Exception {
        CallEventEntity saved = new CallEventEntity();
        saved.setCallId(UUID.randomUUID());
        saved.setDealerId("DLR001");
        saved.setPhone("9876543210");
        saved.setDirection("outbound");

        when(callCommandService.registerCall(any(), anyString())).thenReturn(saved);

        String json = """
                {
                    "dealer_id": "DLR001",
                    "phone": "9876543210",
                    "direction": "outbound",
                    "dealer_code": "DC001",
                    "dealer_name": "Test Dealer",
                    "notes": "Initial call"
                }
                """;

        mockMvc.perform(post("/web/v1/calls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.dealerId").value("DLR001"));

        verify(callCommandService).registerCall(any(), anyString());
    }

    @Test
    void register_missingRequiredFields_returns400() throws Exception {
        String json = """
                {
                    "notes": "missing required fields"
                }
                """;

        mockMvc.perform(post("/web/v1/calls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submitFeedback_delegatesToCommandService() throws Exception {
        UUID callId = UUID.randomUUID();
        CallEventEntity updated = new CallEventEntity();
        updated.setCallId(callId);
        updated.setOutcome("interested");

        when(callCommandService.submitFeedback(eq(callId), any(), eq(KAM_USER_ID), eq("KAM"), anyString()))
                .thenReturn(updated);

        String json = """
                {
                    "outcome": "interested",
                    "call_status": "completed",
                    "disposition_code": "CALLBACK",
                    "is_productive": true,
                    "kam_comments": "Dealer showed interest",
                    "duration": 300
                }
                """;

        mockMvc.perform(put("/web/v1/calls/{callId}/feedback", callId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.outcome").value("interested"));

        verify(callCommandService).submitFeedback(eq(callId), any(), eq(KAM_USER_ID), eq("KAM"), anyString());
    }
}
