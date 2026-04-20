package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.entity.AsyncJobEntity;
import com.cars24.crmcore.service.internal.AsyncJobService;
import com.cars24.crmcore.service.internal.BulkImportService;
import com.cars24.crmcore.service.internal.ExportService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminJobControllerTest {

    @Mock private AsyncJobService asyncJobService;
    @Mock private BulkImportService bulkImportService;
    @Mock private ExportService exportService;

    private MockMvc mockMvc;
    private static final UUID ADMIN_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        CrmRequestContextHolder.set(adminContext());
        AdminJobController controller = new AdminJobController(
                asyncJobService, bulkImportService, exportService,
                new ActorScopeResolver(new RequestContextAccessor()),
                new ApiResponseBuilder());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @AfterEach
    void tearDown() { CrmRequestContextHolder.clear(); }

    @Test
    void submitBulkImport_returns202() throws Exception {
        UUID jobId = UUID.randomUUID();
        when(bulkImportService.submitBulkImport(any(), anyString())).thenReturn(jobId);

        String json = """
                {"csv_content":"dealer_code,kam_user_id\\nDLR-001,some-uuid","import_type":"dealer_kam_mapping"}
                """;

        mockMvc.perform(post("/web/v1/admin/imports")
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.data.jobId").value(jobId.toString()));

        verify(bulkImportService).submitBulkImport(any(), anyString());
    }

    @Test
    void submitExport_returns202() throws Exception {
        UUID jobId = UUID.randomUUID();
        when(exportService.submitExport(any(), anyString())).thenReturn(jobId);

        String json = """
                {"export_type":"dealers","filters":{"region":"North"}}
                """;

        mockMvc.perform(post("/web/v1/admin/exports")
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.data.jobId").value(jobId.toString()));

        verify(exportService).submitExport(any(), anyString());
    }

    @Test
    void getJobStatus_returns200() throws Exception {
        UUID jobId = UUID.randomUUID();
        AsyncJobEntity job = new AsyncJobEntity();
        job.setJobId(jobId);
        job.setJobType("BULK_IMPORT");
        job.setStatus("RUNNING");

        when(asyncJobService.getJob(jobId)).thenReturn(job);

        mockMvc.perform(get("/web/v1/admin/jobs/{jobId}", jobId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RUNNING"));

        verify(asyncJobService).getJob(jobId);
    }

    @Test
    void getMyJobs_returns200() throws Exception {
        AsyncJobEntity job1 = new AsyncJobEntity();
        job1.setJobId(UUID.randomUUID());
        job1.setJobType("EXPORT");
        job1.setStatus("COMPLETED");

        when(asyncJobService.getJobsByUser(ADMIN_USER_ID)).thenReturn(List.of(job1));

        mockMvc.perform(get("/web/v1/admin/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("COMPLETED"));

        verify(asyncJobService).getJobsByUser(ADMIN_USER_ID);
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
