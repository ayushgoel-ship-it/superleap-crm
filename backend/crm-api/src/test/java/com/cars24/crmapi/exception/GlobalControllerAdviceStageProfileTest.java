package com.cars24.crmapi.exception;

import com.cars24.crmapi.CrmApiApplication;
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
@ActiveProfiles("stage")
class GlobalControllerAdviceStageProfileTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsGenericMessageForExternalDependencyFailureInStage() throws Exception {
        mockMvc.perform(get("/public/test/errors/external"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error.code").value("EXTERNAL_DEPENDENCY_FAILURE"))
                .andExpect(jsonPath("$.error.message").value("Upstream dependency failure"));
    }

    @Test
    void returnsGenericMessageForUnexpectedFailureInStage() throws Exception {
        mockMvc.perform(get("/public/test/errors/internal"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.error.message").value("An unexpected error occurred"));
    }
}
