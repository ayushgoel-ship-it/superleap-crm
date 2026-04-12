package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.dto.LeadListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.LeadEntity;
import com.cars24.crmcore.service.internal.LeadCommandService;
import com.cars24.crmcore.service.internal.LeadQueryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class LeadControllerDelegationTest {

    @Mock private LeadQueryService leadQueryService;
    @Mock private LeadCommandService leadCommandService;

    private LeadController leadController;
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

        leadController = new LeadController(leadQueryService, leadCommandService, actorScopeResolver, responseBuilder);
        mockMvc = MockMvcBuilders.standaloneSetup(leadController).build();
    }

    @AfterEach
    void tearDown() {
        CrmRequestContextHolder.clear();
    }

    @Test
    void list_delegatesWithKamScopeAndFilters() throws Exception {
        String kamIdStr = KAM_USER_ID.toString();
        PaginatedResponse<LeadListItem> serviceResult = PaginatedResponse.<LeadListItem>builder()
                .items(List.of()).page(0).pageSize(20).totalItems(0).totalPages(0)
                .build();
        when(leadQueryService.listLeads(eq(kamIdStr), eq("DLR001"), eq("online"), eq("open"), eq("new"), eq("test"), any()))
                .thenReturn(serviceResult);

        mockMvc.perform(get("/web/v1/leads")
                        .param("dealer_code", "DLR001")
                        .param("channel", "online")
                        .param("status", "open")
                        .param("stage", "new")
                        .param("search", "test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(leadQueryService).listLeads(eq(kamIdStr), eq("DLR001"), eq("online"), eq("open"), eq("new"), eq("test"), any());
    }

    @Test
    void detail_delegatesAndMapsToLeadDetailResponse() throws Exception {
        LeadEntity lead = new LeadEntity();
        lead.setLeadId("LEAD-001");
        lead.setCustomerName("John Doe");
        lead.setDealerCode("DLR001");
        when(leadQueryService.getLeadDetail("LEAD-001")).thenReturn(lead);

        mockMvc.perform(get("/web/v1/leads/LEAD-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.lead_id").value("LEAD-001"))
                .andExpect(jsonPath("$.data.customer_name").value("John Doe"));

        verify(leadQueryService).getLeadDetail("LEAD-001");
    }

    @Test
    void createLead_delegatesToCommandService() throws Exception {
        LeadEntity created = new LeadEntity();
        created.setLeadId("LEAD-ABCD1234");
        created.setCustomerName("Jane Doe");
        created.setStatus("open");
        created.setStage("new");

        when(leadCommandService.createLead(any(), anyString())).thenReturn(created);

        String json = """
                {
                    "dealer_code": "DC001",
                    "customer_name": "Jane Doe",
                    "customer_phone": "9876543210",
                    "channel": "online",
                    "make": "Maruti",
                    "model": "Swift"
                }
                """;

        mockMvc.perform(post("/web/v1/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.leadId").value("LEAD-ABCD1234"));

        verify(leadCommandService).createLead(any(), anyString());
    }

    @Test
    void updatePricing_delegatesToCommandService() throws Exception {
        LeadEntity updated = new LeadEntity();
        updated.setLeadId("LEAD-001");
        updated.setCep(new BigDecimal("450000"));
        updated.setCepConfidence("high");

        when(leadCommandService.updatePricing(eq("LEAD-001"), any(), eq(KAM_USER_ID), eq("KAM"), anyString()))
                .thenReturn(updated);

        String json = """
                {
                    "cep": 450000,
                    "cep_confidence": "high"
                }
                """;

        mockMvc.perform(put("/web/v1/leads/LEAD-001/pricing")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.leadId").value("LEAD-001"));

        verify(leadCommandService).updatePricing(eq("LEAD-001"), any(), eq(KAM_USER_ID), eq("KAM"), anyString());
    }
}
