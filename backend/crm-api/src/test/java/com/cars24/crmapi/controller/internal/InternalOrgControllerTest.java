package com.cars24.crmapi.controller.internal;

import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.dto.OrgHierarchyDto;
import com.cars24.crmcore.service.internal.OrgQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class InternalOrgControllerTest {

    @Mock private OrgQueryService orgQueryService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        InternalOrgController controller = new InternalOrgController(
                orgQueryService, new ApiResponseBuilder());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void hierarchy_returnsOrgHierarchy() throws Exception {
        OrgHierarchyDto hierarchy = OrgHierarchyDto.builder()
                .regions(List.of())
                .build();
        when(orgQueryService.getOrgHierarchy()).thenReturn(hierarchy);

        mockMvc.perform(get("/internal/v1/org/hierarchy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.regions").isArray());

        verify(orgQueryService).getOrgHierarchy();
    }
}
