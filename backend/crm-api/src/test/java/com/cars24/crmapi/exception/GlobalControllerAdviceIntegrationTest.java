package com.cars24.crmapi.exception;

import com.cars24.crmapi.CrmApiApplication;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = CrmApiApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GlobalControllerAdviceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void mapsInvalidRequestExceptionToBadRequestEnvelope() throws Exception {
        mockMvc.perform(get("/public/test/errors/invalid-request"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").value(Matchers.nullValue()))
                .andExpect(jsonPath("$.meta.timestamp").exists())
                .andExpect(jsonPath("$.meta.request_id").exists())
                .andExpect(jsonPath("$.error.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.error.message").value("Invalid request payload"));
    }

    @Test
    void mapsValidationFailureToBadRequestEnvelope() throws Exception {
        mockMvc.perform(get("/public/test/errors/validation").param("count", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_REQUEST"));
    }

    @Test
    void mapsForbiddenExceptionToForbiddenEnvelope() throws Exception {
        mockMvc.perform(get("/public/test/errors/forbidden"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.error.message").value("Forbidden access"));
    }

    @Test
    void mapsNotFoundExceptionToNotFoundEnvelope() throws Exception {
        mockMvc.perform(get("/public/test/errors/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.error.message").value("Dealer not found"));
    }

    @Test
    void mapsOptimisticConflictToConflictEnvelope() throws Exception {
        mockMvc.perform(get("/public/test/errors/conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("OPTIMISTIC_CONFLICT"))
                .andExpect(jsonPath("$.error.message").value("Update conflict"));
    }

    @Test
    void mapsExternalDependencyToBadGatewayEnvelope() throws Exception {
        mockMvc.perform(get("/public/test/errors/external"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error.code").value("EXTERNAL_DEPENDENCY_FAILURE"))
                .andExpect(jsonPath("$.error.message").value("Partner service timed out"));
    }

    @Test
    void mapsUnexpectedExceptionToInternalErrorEnvelope() throws Exception {
        mockMvc.perform(get("/public/test/errors/internal"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.error.message").value("Internal state exploded"));
    }
}
