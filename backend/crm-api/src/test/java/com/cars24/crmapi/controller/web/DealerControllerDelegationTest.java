package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.dto.DealerListItem;
import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.entity.UntaggedDealerEntity;
import com.cars24.crmcore.service.internal.DealerCommandService;
import com.cars24.crmcore.service.internal.DealerQueryService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DealerControllerDelegationTest {

    @Mock private DealerQueryService dealerQueryService;
    @Mock private DealerCommandService dealerCommandService;

    private DealerController dealerController;
    private MockMvc mockMvc;

    private static final UUID KAM_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        RequestContext ctx = RequestContext.builder()
                .authenticated(true)
                .effectiveActor(ActorContext.builder()
                        .userId(KAM_USER_ID.toString())
                        .roles(List.of("KAM"))
                        .permissions(List.of("read:dealers"))
                        .tenantGroup("cars24")
                        .build())
                .actorScope(ActorScope.SELF)
                .metadata(AuthMetadata.builder().requestId("req-test").build())
                .build();
        CrmRequestContextHolder.set(ctx);

        RequestContextAccessor accessor = new RequestContextAccessor();
        ActorScopeResolver actorScopeResolver = new ActorScopeResolver(accessor);
        ApiResponseBuilder responseBuilder = new ApiResponseBuilder();

        dealerController = new DealerController(dealerQueryService, dealerCommandService, actorScopeResolver, responseBuilder);
        mockMvc = MockMvcBuilders.standaloneSetup(dealerController).build();
    }

    @AfterEach
    void tearDown() {
        CrmRequestContextHolder.clear();
    }

    @Test
    void list_kamScope_passesOwnKamId() throws Exception {
        PaginatedResponse<DealerListItem> serviceResult = PaginatedResponse.<DealerListItem>builder()
                .items(List.of()).page(0).pageSize(20).totalItems(0).totalPages(0)
                .build();
        when(dealerQueryService.listDealers(eq(KAM_USER_ID), isNull(), isNull(), isNull(), isNull(), any()))
                .thenReturn(serviceResult);

        mockMvc.perform(get("/web/v1/dealers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.meta.request_id").value("req-test"))
                .andExpect(jsonPath("$.meta.role").value("KAM"));

        verify(dealerQueryService).listDealers(eq(KAM_USER_ID), isNull(), isNull(), isNull(), isNull(), any());
    }

    @Test
    void list_passesFilterParams() throws Exception {
        PaginatedResponse<DealerListItem> serviceResult = PaginatedResponse.<DealerListItem>builder()
                .items(List.of()).page(0).pageSize(10).totalItems(0).totalPages(0)
                .build();
        when(dealerQueryService.listDealers(eq(KAM_USER_ID), isNull(), eq("A"), eq("active"), eq("test"), any()))
                .thenReturn(serviceResult);

        mockMvc.perform(get("/web/v1/dealers")
                        .param("segment", "A")
                        .param("status", "active")
                        .param("search", "test")
                        .param("page", "1")
                        .param("page_size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(dealerQueryService).listDealers(eq(KAM_USER_ID), isNull(), eq("A"), eq("active"), eq("test"), any());
    }

    @Test
    void detail_delegatesAndReturnsEnvelope() throws Exception {
        DealerEntity dealer = new DealerEntity();
        dealer.setDealerCode("DLR001");
        dealer.setDealerName("Test Dealer");
        when(dealerQueryService.getDealerDetail("DLR001")).thenReturn(dealer);

        mockMvc.perform(get("/web/v1/dealers/DLR001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.dealer_code").value("DLR001"))
                .andExpect(jsonPath("$.data.dealer_name").value("Test Dealer"));

        verify(dealerQueryService).getDealerDetail("DLR001");
    }

    @Test
    void logUntaggedDealer_delegatesToCommandService() throws Exception {
        UntaggedDealerEntity saved = new UntaggedDealerEntity();
        saved.setId("ut-123");
        saved.setPhone("9876543210");
        saved.setName("New Dealer");

        when(dealerCommandService.logUntaggedDealer(any(), anyString())).thenReturn(saved);

        String json = """
                {
                    "phone": "9876543210",
                    "name": "New Dealer",
                    "city": "Delhi",
                    "notes": "Found during field visit"
                }
                """;

        mockMvc.perform(post("/web/v1/dealers/untagged")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("New Dealer"));

        verify(dealerCommandService).logUntaggedDealer(any(), anyString());
    }

    @Test
    void toggleTopTag_delegatesToCommandService() throws Exception {
        DealerEntity updated = new DealerEntity();
        updated.setDealerCode("DLR001");
        updated.setIsTop(true);

        when(dealerCommandService.toggleTopTag(eq("DLR001"), eq(KAM_USER_ID), eq("KAM"), anyString()))
                .thenReturn(updated);

        mockMvc.perform(put("/web/v1/dealers/DLR001/top-tag"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isTop").value(true));

        verify(dealerCommandService).toggleTopTag(eq("DLR001"), eq(KAM_USER_ID), eq("KAM"), anyString());
    }

    @Test
    void requestLocationUpdate_delegatesToCommandService() throws Exception {
        DealerEntity updated = new DealerEntity();
        updated.setDealerCode("DLR001");
        updated.setAddress("New Address 123");

        when(dealerCommandService.requestLocationUpdate(any(), eq(KAM_USER_ID), eq("KAM"), anyString()))
                .thenReturn(updated);

        String json = """
                {
                    "dealer_code": "DLR001",
                    "new_address": "New Address 123",
                    "new_city": "Mumbai",
                    "reason": "Dealer relocated"
                }
                """;

        mockMvc.perform(post("/web/v1/dealers/location-request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.address").value("New Address 123"));

        verify(dealerCommandService).requestLocationUpdate(any(), eq(KAM_USER_ID), eq("KAM"), anyString());
    }
}
