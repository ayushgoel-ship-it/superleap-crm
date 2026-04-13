package com.cars24.crmapi.controller.publicapi;

import com.cars24.crmcore.service.internal.HealthQueryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class HealthControllerDelegationTest {

    @Mock
    private HealthQueryService healthQueryService;

    @InjectMocks
    private HealthController healthController;

    @Test
    void delegatesHealthLookupToService() throws Exception {
        when(healthQueryService.getHealthStatus()).thenReturn("OK");

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(healthController).build();

        mockMvc.perform(get("/public/health"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string("OK"));

        verify(healthQueryService).getHealthStatus();
    }
}
