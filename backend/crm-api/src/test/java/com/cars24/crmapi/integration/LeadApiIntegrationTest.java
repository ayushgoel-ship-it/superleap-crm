package com.cars24.crmapi.integration;

import com.cars24.crmcore.repository.postgres.LeadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end: create a lead via POST, then retrieve it via GET,
 * exercising the full stack against real Postgres.
 */
class LeadApiIntegrationTest extends AbstractContainerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private LeadRepository leadRepository;

    @BeforeEach
    void setUp() {
        leadRepository.deleteAll();
    }

    @Test
    void createAndRetrieveLead() throws Exception {
        String createJson = """
                {
                    "dealer_code": "DLR-E2E",
                    "dealer_name": "E2E Motors",
                    "customer_name": "Jane Doe",
                    "customer_phone": "9876543210",
                    "channel": "DealerReferral",
                    "lead_type": "sell",
                    "make": "Maruti",
                    "model": "Swift",
                    "year": "2022",
                    "city": "Mumbai",
                    "region": "West"
                }
                """;

        MvcResult createResult = mockMvc.perform(post("/web/v1/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createJson)
                        .header("X-User-Id", "kam-e2e-01")
                        .header("X-User-Role", "KAM")
                        .header("X-Team-Id", "team-e2e"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.leadId").exists())
                .andExpect(jsonPath("$.data.customerName").value("Jane Doe"))
                .andExpect(jsonPath("$.data.status").value("open"))
                .andExpect(jsonPath("$.data.stage").value("new"))
                .andReturn();

        // Extract leadId from response
        String body = createResult.getResponse().getContentAsString();
        String leadId = com.jayway.jsonpath.JsonPath.read(body, "$.data.leadId");

        // Verify persisted in Postgres
        assertThat(leadRepository.findByLeadId(leadId)).isPresent();

        // GET detail
        mockMvc.perform(get("/web/v1/leads/{leadId}", leadId)
                        .header("X-User-Id", "kam-e2e-01")
                        .header("X-User-Role", "KAM")
                        .header("X-Team-Id", "team-e2e"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lead_id").value(leadId))
                .andExpect(jsonPath("$.data.customer_name").value("Jane Doe"));

        // GET list
        mockMvc.perform(get("/web/v1/leads")
                        .header("X-User-Id", "kam-e2e-01")
                        .header("X-User-Role", "KAM")
                        .header("X-Team-Id", "team-e2e"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void createLead_missingRequiredField_returns400() throws Exception {
        String json = """
                {
                    "dealer_name": "E2E Motors",
                    "channel": "DealerReferral"
                }
                """;

        mockMvc.perform(post("/web/v1/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .header("X-User-Id", "kam-e2e-01")
                        .header("X-User-Role", "KAM")
                        .header("X-Team-Id", "team-e2e"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getLeadDetail_notFound_returns404() throws Exception {
        mockMvc.perform(get("/web/v1/leads/{leadId}", "LEAD-NONEXISTENT")
                        .header("X-User-Id", "kam-e2e-01")
                        .header("X-User-Role", "KAM")
                        .header("X-Team-Id", "team-e2e"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }
}
