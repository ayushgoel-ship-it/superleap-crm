package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.service.internal.UploadService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.net.URL;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UploadControllerTest {

    @Mock private UploadService uploadService;

    private MockMvc mockMvc;
    private static final UUID USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        CrmRequestContextHolder.set(userContext());
        UploadController controller = new UploadController(
                uploadService,
                new ActorScopeResolver(new RequestContextAccessor()),
                new ApiResponseBuilder());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @AfterEach
    void tearDown() { CrmRequestContextHolder.clear(); }

    @Test
    void initiateUpload_returns201() throws Exception {
        UUID uploadId = UUID.randomUUID();
        URL uploadUrl = new URL("https://storage.example.com/upload?token=abc");
        UploadService.UploadInitiation initiation =
                new UploadService.UploadInitiation(uploadId, uploadUrl, "uploads/lead/doc.pdf");

        when(uploadService.initiateUpload(anyString(), anyString(), anyString(), anyString(), anyLong(), eq(USER_ID)))
                .thenReturn(initiation);

        String json = """
                {
                    "entity_type": "lead",
                    "entity_id": "LEAD-001",
                    "file_name": "doc.pdf",
                    "content_type": "application/pdf",
                    "size_bytes": 1024
                }
                """;

        mockMvc.perform(post("/web/v1/uploads/initiate")
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.uploadId").value(uploadId.toString()))
                .andExpect(jsonPath("$.data.storageKey").value("uploads/lead/doc.pdf"));

        verify(uploadService).initiateUpload("lead", "LEAD-001", "doc.pdf", "application/pdf", 1024L, USER_ID);
    }

    @Test
    void getDownloadUrl_returns200() throws Exception {
        UUID uploadId = UUID.randomUUID();
        URL downloadUrl = new URL("https://storage.example.com/download?token=xyz");

        when(uploadService.getDownloadUrl(uploadId)).thenReturn(downloadUrl);

        mockMvc.perform(get("/web/v1/uploads/{uploadId}/download", uploadId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.downloadUrl").value(downloadUrl.toString()));

        verify(uploadService).getDownloadUrl(uploadId);
    }

    @Test
    void listUploads_returns200() throws Exception {
        when(uploadService.listUploads("lead", "LEAD-001")).thenReturn(List.of());

        mockMvc.perform(get("/web/v1/uploads")
                        .param("entity_type", "lead")
                        .param("entity_id", "LEAD-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        verify(uploadService).listUploads("lead", "LEAD-001");
    }

    @Test
    void deleteUpload_returns204() throws Exception {
        UUID uploadId = UUID.randomUUID();

        mockMvc.perform(delete("/web/v1/uploads/{uploadId}", uploadId))
                .andExpect(status().isNoContent());

        verify(uploadService).deleteUpload(uploadId, USER_ID);
    }

    private RequestContext userContext() {
        return RequestContext.builder()
                .authenticated(true)
                .effectiveActor(ActorContext.builder()
                        .userId(USER_ID.toString())
                        .roles(List.of("KAM"))
                        .permissions(List.of())
                        .tenantGroup("cars24")
                        .build())
                .actorScope(ActorScope.SELF)
                .metadata(AuthMetadata.builder().requestId("req-upload").build())
                .build();
    }
}
