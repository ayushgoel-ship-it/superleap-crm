package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.*;
import com.cars24.crmapi.controller.support.ActorScopeResolver;
import com.cars24.crmapi.controller.support.ApiResponseBuilder;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.service.internal.UserCommandService;
import com.cars24.crmcore.service.internal.UserQueryService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    @Mock private UserCommandService userCommandService;
    @Mock private UserQueryService userQueryService;

    private MockMvc mockMvc;
    private static final UUID ADMIN_USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        CrmRequestContextHolder.set(adminContext());
        AdminUserController controller = new AdminUserController(
                userCommandService,
                userQueryService,
                new ActorScopeResolver(new RequestContextAccessor()),
                new ApiResponseBuilder());
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @AfterEach
    void tearDown() { CrmRequestContextHolder.clear(); }

    @Test
    void listUsers_returnsAll() throws Exception {
        UserEntity user1 = new UserEntity();
        user1.setUserId(UUID.randomUUID());
        user1.setName("Alice");
        user1.setRole("KAM");
        user1.setActive(true);

        when(userQueryService.listUsers(null, null, null)).thenReturn(List.of(user1));

        mockMvc.perform(get("/web/v1/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Alice"));

        verify(userQueryService).listUsers(null, null, null);
    }

    @Test
    void getUser_returnsDetail() throws Exception {
        UUID userId = UUID.randomUUID();
        UserEntity user = new UserEntity();
        user.setUserId(userId);
        user.setName("Bob");

        when(userQueryService.getUserDetail(userId)).thenReturn(user);

        mockMvc.perform(get("/web/v1/admin/users/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Bob"));

        verify(userQueryService).getUserDetail(userId);
    }

    @Test
    void createUser_returns201() throws Exception {
        UserEntity created = new UserEntity();
        created.setUserId(UUID.randomUUID());
        created.setName("John Doe");
        created.setEmail("john@example.com");
        created.setRole("KAM");
        created.setActive(true);

        when(userCommandService.createUser(any(), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(created);

        String json = """
                {"name":"John Doe","email":"john@example.com","role":"KAM","region":"North","city":"Delhi"}
                """;

        mockMvc.perform(post("/web/v1/admin/users").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("John Doe"));

        verify(userCommandService).createUser(any(), eq(ADMIN_USER_ID), anyString());
    }

    @Test
    void updateUser_returns200() throws Exception {
        UUID userId = UUID.randomUUID();
        UserEntity updated = new UserEntity();
        updated.setUserId(userId);
        updated.setName("John Updated");
        updated.setRole("TL");

        when(userCommandService.updateUser(eq(userId), any(), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(updated);

        String json = """
                {"name":"John Updated","role":"TL"}
                """;

        mockMvc.perform(put("/web/v1/admin/users/{userId}", userId)
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("TL"));

        verify(userCommandService).updateUser(eq(userId), any(), eq(ADMIN_USER_ID), anyString());
    }

    @Test
    void deactivateUser_returns200() throws Exception {
        UUID userId = UUID.randomUUID();
        UserEntity updated = new UserEntity();
        updated.setUserId(userId);
        updated.setActive(false);

        when(userCommandService.deactivateUser(eq(userId), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(updated);

        mockMvc.perform(put("/web/v1/admin/users/{userId}/deactivate", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));

        verify(userCommandService).deactivateUser(eq(userId), eq(ADMIN_USER_ID), anyString());
    }

    @Test
    void reactivateUser_returns200() throws Exception {
        UUID userId = UUID.randomUUID();
        UserEntity updated = new UserEntity();
        updated.setUserId(userId);
        updated.setActive(true);

        when(userCommandService.reactivateUser(eq(userId), eq(ADMIN_USER_ID), anyString()))
                .thenReturn(updated);

        mockMvc.perform(put("/web/v1/admin/users/{userId}/reactivate", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(true));

        verify(userCommandService).reactivateUser(eq(userId), eq(ADMIN_USER_ID), anyString());
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
