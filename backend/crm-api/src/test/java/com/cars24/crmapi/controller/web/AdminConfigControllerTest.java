package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.entity.IncentiveRuleEntity;
import com.cars24.crmcore.entity.IncentiveSlabEntity;
import com.cars24.crmcore.service.internal.ConfigCommandService;
import com.cars24.crmcore.service.internal.ConfigQueryService;
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
class AdminConfigControllerTest {

    @Mock private ConfigCommandService configCommandService;
    @Mock private ConfigQueryService configQueryService;

    private MockMvc mockMvc;
    private static final UUID ADMIN_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        CrmRequestContextHolder.set(adminContext());
        AdminConfigController controller = new AdminConfigController(
                configCommandService,
                configQueryService,
                new ActorScopeResolver(new RequestContextAccessor()),
                new ApiResponseBuilder());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @AfterEach
    void tearDown() { CrmRequestContextHolder.clear(); }

    @Test
    void listSlabs_returnsAll() throws Exception {
        IncentiveSlabEntity slab = new IncentiveSlabEntity();
        slab.setSlabId(UUID.randomUUID());
        slab.setSlabName("Gold");
        slab.setMetricKey("si_count");

        when(configQueryService.listSlabs(null, null)).thenReturn(List.of(slab));

        mockMvc.perform(get("/web/v1/admin/config/slabs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].slabName").value("Gold"));

        verify(configQueryService).listSlabs(null, null);
    }

    @Test
    void listRules_returnsAll() throws Exception {
        IncentiveRuleEntity rule = new IncentiveRuleEntity();
        rule.setRuleId(UUID.randomUUID());
        rule.setScope("KAM");
        rule.setMetricKey("si_count");

        when(configQueryService.listRules(null, null)).thenReturn(List.of(rule));

        mockMvc.perform(get("/web/v1/admin/config/rules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].scope").value("KAM"));

        verify(configQueryService).listRules(null, null);
    }

    @Test
    void createSlab_returns201() throws Exception {
        IncentiveSlabEntity created = new IncentiveSlabEntity();
        created.setSlabId(UUID.randomUUID());
        created.setSlabName("Gold Slab");
        created.setMetricKey("si_count");

        when(configCommandService.createSlab(any(), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(created);

        String json = """
                {"slab_name":"Gold Slab","metric_key":"si_count","min_value":10,"max_value":20,"payout_amount":5000}
                """;

        mockMvc.perform(post("/web/v1/admin/config/slabs")
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.slabName").value("Gold Slab"));

        verify(configCommandService).createSlab(any(), eq(ADMIN_USER_ID), anyString());
    }

    @Test
    void updateSlab_returns200() throws Exception {
        UUID slabId = UUID.randomUUID();
        IncentiveSlabEntity updated = new IncentiveSlabEntity();
        updated.setSlabId(slabId);
        updated.setSlabName("Updated Slab");
        updated.setPayoutAmount(new BigDecimal("7500"));

        when(configCommandService.updateSlab(eq(slabId), any(), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(updated);

        String json = """
                {"slab_name":"Updated Slab","payout_amount":7500}
                """;

        mockMvc.perform(put("/web/v1/admin/config/slabs/{slabId}", slabId)
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slabName").value("Updated Slab"));

        verify(configCommandService).updateSlab(eq(slabId), any(), eq(ADMIN_USER_ID), anyString());
    }

    @Test
    void createRule_returns201() throws Exception {
        IncentiveRuleEntity created = new IncentiveRuleEntity();
        created.setRuleId(UUID.randomUUID());
        created.setScope("KAM");
        created.setMetricKey("si_count");

        when(configCommandService.createRule(any(), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(created);

        String json = """
                {"scope":"KAM","metric_key":"si_count","threshold":15,"payout":3000,"description":"SI count bonus"}
                """;

        mockMvc.perform(post("/web/v1/admin/config/rules")
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.scope").value("KAM"));

        verify(configCommandService).createRule(any(), eq(ADMIN_USER_ID), anyString());
    }

    @Test
    void updateRule_returns200() throws Exception {
        UUID ruleId = UUID.randomUUID();
        IncentiveRuleEntity updated = new IncentiveRuleEntity();
        updated.setRuleId(ruleId);
        updated.setScope("TL");
        updated.setPayout(new BigDecimal("5000"));

        when(configCommandService.updateRule(eq(ruleId), any(), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(updated);

        String json = """
                {"scope":"TL","payout":5000}
                """;

        mockMvc.perform(put("/web/v1/admin/config/rules/{ruleId}", ruleId)
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.scope").value("TL"));

        verify(configCommandService).updateRule(eq(ruleId), any(), eq(ADMIN_USER_ID), anyString());
    }

    private RequestContext adminContext() {
        return RequestContext.builder()
                .authenticated(true)
                .effectiveActor(ActorContext.builder()
                        .userId(ADMIN_USER_ID.toString())
                        .roles(List.of("ADMIN"))
                        .permissions(List.of())
                        .tenantGroup("cars24")
                        .build())
                .actorScope(ActorScope.GLOBAL)
                .metadata(AuthMetadata.builder().requestId("req-admin").build())
                .build();
    }
}
