package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.entity.DcfLeadEntity;
import com.cars24.crmcore.entity.DcfTimelineEventEntity;
import com.cars24.crmcore.service.internal.DcfCommandService;
import com.cars24.crmcore.service.internal.DcfQueryService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DcfControllerDelegationTest {

    @Mock private DcfCommandService dcfCommandService;
    @Mock private DcfQueryService dcfQueryService;

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
                .metadata(AuthMetadata.builder().requestId("req-dcf").build())
                .build();
        CrmRequestContextHolder.set(ctx);

        RequestContextAccessor accessor = new RequestContextAccessor();
        ActorScopeResolver actorScopeResolver = new ActorScopeResolver(accessor);
        ApiResponseBuilder responseBuilder = new ApiResponseBuilder();

        DcfController controller = new DcfController(dcfCommandService, dcfQueryService, actorScopeResolver, responseBuilder);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @AfterEach
    void tearDown() {
        CrmRequestContextHolder.clear();
    }

    @Test
    void submitOnboarding_returns201() throws Exception {
        DcfLeadEntity created = new DcfLeadEntity();
        created.setId(UUID.randomUUID());
        created.setDcfId("DCF-ABCD1234");
        created.setDealerCode("DLR-001");
        created.setCustomerName("John Doe");
        created.setCurrentFunnel("application");
        created.setOverallStatus("active");
        created.setCarValue(new BigDecimal("500000"));

        when(dcfCommandService.submitOnboarding(any(), anyString()))
                .thenReturn(created);

        String json = """
                {
                    "dealer_code": "DLR-001",
                    "dealer_city": "Delhi",
                    "customer_name": "John Doe",
                    "customer_phone": "9876543210",
                    "car_value": 500000,
                    "loan_amount": 300000,
                    "roi": 12.5,
                    "tenure": 36
                }
                """;

        mockMvc.perform(post("/web/v1/dcf/onboard")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.dcfId").value("DCF-ABCD1234"))
                .andExpect(jsonPath("$.data.currentFunnel").value("application"));

        verify(dcfCommandService).submitOnboarding(any(), anyString());
    }

    @Test
    void submitOnboarding_missingRequiredFields_returns400() throws Exception {
        String json = """
                {
                    "dealer_city": "Delhi"
                }
                """;

        mockMvc.perform(post("/web/v1/dcf/onboard")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getDcfDetail_returns200() throws Exception {
        DcfLeadEntity entity = new DcfLeadEntity();
        entity.setDcfId("DCF-123");
        entity.setDealerCode("DLR-001");
        entity.setCurrentFunnel("application");

        when(dcfQueryService.getDcfDetail("DCF-123")).thenReturn(entity);

        mockMvc.perform(get("/web/v1/dcf/{dcfId}", "DCF-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.dcfId").value("DCF-123"));

        verify(dcfQueryService).getDcfDetail("DCF-123");
    }

    @Test
    void getTimeline_returns200() throws Exception {
        DcfTimelineEventEntity e1 = new DcfTimelineEventEntity();
        e1.setEventType("ONBOARDING_SUBMITTED");

        when(dcfQueryService.getTimeline("DCF-123")).thenReturn(List.of(e1));

        mockMvc.perform(get("/web/v1/dcf/{dcfId}/timeline", "DCF-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].eventType").value("ONBOARDING_SUBMITTED"));

        verify(dcfQueryService).getTimeline("DCF-123");
    }
}
