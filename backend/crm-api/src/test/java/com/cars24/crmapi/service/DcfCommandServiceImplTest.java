package com.cars24.crmapi.service;

import com.cars24.crmcore.dto.command.SubmitDcfOnboardingCommand;
import com.cars24.crmcore.entity.DcfLeadEntity;
import com.cars24.crmcore.repository.postgres.DcfLeadRepository;
import com.cars24.crmcore.repository.postgres.DcfTimelineEventRepository;
import com.cars24.crmcore.service.impl.DcfCommandServiceImpl;
import com.cars24.crmcore.service.internal.AuditService;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DcfCommandServiceImplTest {

    @Mock private DcfLeadRepository dcfLeadRepository;
    @Mock private DcfTimelineEventRepository dcfTimelineEventRepository;
    @Mock private AuditService auditService;
    @Mock private ApplicationEventPublisher eventPublisher;

    private DcfCommandServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new DcfCommandServiceImpl(dcfLeadRepository, dcfTimelineEventRepository,
                auditService, eventPublisher, new SimpleMeterRegistry());
    }

    @Test
    void submitOnboarding_createsLeadWithDefaults() {
        UUID kamId = UUID.randomUUID();
        SubmitDcfOnboardingCommand command = SubmitDcfOnboardingCommand.builder()
                .dealerCode("DLR-001")
                .dealerCity("Delhi")
                .customerName("John Doe")
                .customerPhone("9876543210")
                .carValue(new BigDecimal("500000"))
                .loanAmount(new BigDecimal("300000"))
                .kamId(kamId)
                .kamName("KAM User")
                .build();

        when(dcfLeadRepository.save(any())).thenAnswer(inv -> {
            DcfLeadEntity e = inv.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });
        when(dcfTimelineEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DcfLeadEntity result = service.submitOnboarding(command, "req-dcf-1");

        assertThat(result.getDcfId()).startsWith("DCF-");
        assertThat(result.getDealerCode()).isEqualTo("DLR-001");
        assertThat(result.getCustomerName()).isEqualTo("John Doe");
        assertThat(result.getCurrentFunnel()).isEqualTo("application");
        assertThat(result.getOverallStatus()).isEqualTo("active");
        assertThat(result.getCarValue()).isEqualByComparingTo(new BigDecimal("500000"));
        assertThat(result.getCreatedAt()).isNotNull();

        verify(dcfLeadRepository).save(any());
        verify(dcfTimelineEventRepository).save(any());
        verify(auditService).log(eq(kamId), eq("KAM"), eq("DCF_ONBOARDING_SUBMIT"),
                eq("dcf_leads_master"), anyString(), isNull(), isNull(), anyString(), eq("req-dcf-1"));
    }

    @Test
    void submitOnboarding_generatesUniqueIds() {
        UUID kamId = UUID.randomUUID();
        SubmitDcfOnboardingCommand command = SubmitDcfOnboardingCommand.builder()
                .dealerCode("DLR-002")
                .customerName("Jane Doe")
                .customerPhone("9876543211")
                .carValue(new BigDecimal("400000"))
                .loanAmount(new BigDecimal("250000"))
                .kamId(kamId)
                .build();

        when(dcfLeadRepository.save(any())).thenAnswer(inv -> {
            DcfLeadEntity e = inv.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });
        when(dcfTimelineEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DcfLeadEntity result1 = service.submitOnboarding(command, "req-1");
        DcfLeadEntity result2 = service.submitOnboarding(command, "req-2");

        assertThat(result1.getDcfId()).isNotEqualTo(result2.getDcfId());
    }

    @Test
    void submitOnboarding_createsTimelineEvent() {
        UUID kamId = UUID.randomUUID();
        SubmitDcfOnboardingCommand command = SubmitDcfOnboardingCommand.builder()
                .dealerCode("DLR-003")
                .customerName("Test Customer")
                .customerPhone("9876543212")
                .carValue(new BigDecimal("600000"))
                .loanAmount(new BigDecimal("400000"))
                .kamId(kamId)
                .build();

        when(dcfLeadRepository.save(any())).thenAnswer(inv -> {
            DcfLeadEntity e = inv.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });
        when(dcfTimelineEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.submitOnboarding(command, "req-timeline");

        verify(dcfTimelineEventRepository).save(argThat(event ->
                "ONBOARDING_SUBMITTED".equals(event.getEventType()) &&
                event.getDcfId() != null &&
                kamId.equals(event.getActorUserId())
        ));
    }
}
