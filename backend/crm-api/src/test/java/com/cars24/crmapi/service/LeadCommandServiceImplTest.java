package com.cars24.crmapi.service;

import com.cars24.crmcore.dto.command.CreateLeadCommand;
import com.cars24.crmcore.dto.command.UpdateLeadPricingCommand;
import com.cars24.crmcore.entity.LeadEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.LeadRepository;
import com.cars24.crmcore.service.impl.LeadCommandServiceImpl;
import com.cars24.crmcore.service.internal.AuditService;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeadCommandServiceImplTest {

    @Mock private LeadRepository leadRepository;
    @Mock private AuditService auditService;
    @Mock private ApplicationEventPublisher eventPublisher;

    private LeadCommandServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new LeadCommandServiceImpl(leadRepository, auditService, eventPublisher, new SimpleMeterRegistry());
    }

    @Test
    void createLead_generatesLeadIdAndSetsDefaults() {
        UUID kamId = UUID.randomUUID();
        CreateLeadCommand command = CreateLeadCommand.builder()
                .dealerCode("DC001")
                .customerName("Jane Doe")
                .customerPhone("9876543210")
                .channel("online")
                .kamId(kamId)
                .build();

        when(leadRepository.save(any())).thenAnswer(inv -> {
            LeadEntity e = inv.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        LeadEntity result = service.createLead(command, "req-50");

        assertThat(result.getLeadId()).startsWith("LEAD-");
        assertThat(result.getCustomerName()).isEqualTo("Jane Doe");
        assertThat(result.getStatus()).isEqualTo("open");
        assertThat(result.getStage()).isEqualTo("new");
        assertThat(result.getCreatedAt()).isNotNull();

        verify(auditService).log(eq(kamId), eq("KAM"), eq("LEAD_CREATE"),
                eq("sell_leads_master"), anyString(), isNull(), isNull(), anyString(), eq("req-50"));
    }

    @Test
    void updatePricing_updatesLeadCepFields() {
        LeadEntity existing = new LeadEntity();
        existing.setLeadId("LEAD-001");
        existing.setCep(new BigDecimal("300000"));

        when(leadRepository.findByLeadId("LEAD-001")).thenReturn(Optional.of(existing));
        when(leadRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID actorId = UUID.randomUUID();
        UpdateLeadPricingCommand command = UpdateLeadPricingCommand.builder()
                .cep(new BigDecimal("450000"))
                .cepConfidence("high")
                .build();

        LeadEntity result = service.updatePricing("LEAD-001", command, actorId, "KAM", "req-100");

        assertThat(result.getCep()).isEqualByComparingTo("450000");
        assertThat(result.getCepConfidence()).isEqualTo("high");
        assertThat(result.getUpdatedAt()).isNotNull();

        verify(auditService).log(eq(actorId), eq("KAM"), eq("LEAD_UPDATE_PRICING"),
                eq("sell_leads_master"), eq("LEAD-001"), anyString(), anyString(), anyString(), eq("req-100"));
    }

    @Test
    void updatePricing_leadNotFound_throwsResourceNotFound() {
        when(leadRepository.findByLeadId("LEAD-999")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.updatePricing("LEAD-999", UpdateLeadPricingCommand.builder()
                                .cep(new BigDecimal("100")).build(),
                        UUID.randomUUID(), "KAM", "req-x"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("LEAD-999");
    }
}
