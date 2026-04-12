package com.cars24.crmapi.service;

import com.cars24.crmcore.dto.command.CompleteVisitCommand;
import com.cars24.crmcore.dto.command.StartVisitCommand;
import com.cars24.crmcore.entity.VisitEntity;
import com.cars24.crmcore.exception.ForbiddenException;
import com.cars24.crmcore.exception.IllegalStateTransitionException;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.VisitRepository;
import com.cars24.crmcore.service.impl.VisitCommandServiceImpl;
import com.cars24.crmcore.service.internal.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VisitCommandServiceImplTest {

    @Mock private VisitRepository visitRepository;
    @Mock private AuditService auditService;
    @Mock private ApplicationEventPublisher eventPublisher;

    private VisitCommandServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new VisitCommandServiceImpl(visitRepository, auditService, eventPublisher);
    }

    // ── startVisit ────────────────────────────────────────────────────

    @Test
    void startVisit_createsEntityWithCheckedInStatus() {
        UUID kamId = UUID.randomUUID();
        StartVisitCommand command = StartVisitCommand.builder()
                .dealerId("DLR001")
                .dealerCode("DC001")
                .dealerName("Test Dealer")
                .kamId(kamId)
                .visitType("regular")
                .geoLat(new BigDecimal("28.6139"))
                .geoLng(new BigDecimal("77.2090"))
                .notes("First visit")
                .build();

        when(visitRepository.save(any())).thenAnswer(inv -> {
            VisitEntity e = inv.getArgument(0);
            e.setVisitId(UUID.randomUUID());
            return e;
        });

        VisitEntity result = service.startVisit(command, "req-100");

        assertThat(result.getDealerId()).isEqualTo("DLR001");
        assertThat(result.getVisitType()).isEqualTo("regular");
        assertThat(result.getStatus()).isEqualTo("CHECKED_IN");
        assertThat(result.getKamId()).isEqualTo(kamId);
        assertThat(result.getGeoLat()).isEqualByComparingTo("28.6139");
        assertThat(result.getCheckInAt()).isNotNull();
        assertThat(result.getCreatedAt()).isNotNull();

        verify(auditService).log(eq(kamId), eq("KAM"), eq("VISIT_START"),
                eq("visit"), anyString(), isNull(), isNull(), anyString(), eq("req-100"));
    }

    // ── completeVisit ─────────────────────────────────────────────────

    @Test
    void completeVisit_updatesEntityToCompleted() {
        UUID visitId = UUID.randomUUID();
        UUID kamId = UUID.randomUUID();

        VisitEntity existing = new VisitEntity();
        existing.setVisitId(visitId);
        existing.setKamId(kamId);
        existing.setStatus("CHECKED_IN");
        existing.setCheckInAt(Instant.now().minusSeconds(600));

        when(visitRepository.findById(visitId)).thenReturn(Optional.of(existing));
        when(visitRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CompleteVisitCommand command = CompleteVisitCommand.builder()
                .isProductive(true)
                .outcomes("Discussed pricing")
                .kamComments("Positive interaction")
                .checkoutLat(new BigDecimal("28.6140"))
                .checkoutLng(new BigDecimal("77.2091"))
                .build();

        VisitEntity result = service.completeVisit(visitId, command, kamId, "KAM", "req-200");

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(result.getIsProductive()).isTrue();
        assertThat(result.getOutcomes()).isEqualTo("Discussed pricing");
        assertThat(result.getCompletedAt()).isNotNull();
        assertThat(result.getDuration()).isNotNull();
        assertThat(result.getDuration()).isGreaterThanOrEqualTo(600);
        assertThat(result.getUpdatedAt()).isNotNull();

        verify(auditService).log(eq(kamId), eq("KAM"), eq("VISIT_COMPLETE"),
                eq("visit"), eq(visitId.toString()), anyString(), anyString(), anyString(), eq("req-200"));
    }

    @Test
    void completeVisit_visitNotFound_throwsResourceNotFound() {
        UUID visitId = UUID.randomUUID();
        when(visitRepository.findById(visitId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.completeVisit(visitId, CompleteVisitCommand.builder().build(),
                        UUID.randomUUID(), "KAM", "req-x"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(visitId.toString());
    }

    @Test
    void completeVisit_kamNotOwner_throwsForbidden() {
        UUID visitId = UUID.randomUUID();
        UUID ownerKamId = UUID.randomUUID();
        UUID otherKamId = UUID.randomUUID();

        VisitEntity existing = new VisitEntity();
        existing.setVisitId(visitId);
        existing.setKamId(ownerKamId);
        existing.setStatus("CHECKED_IN");

        when(visitRepository.findById(visitId)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() ->
                service.completeVisit(visitId, CompleteVisitCommand.builder().build(),
                        otherKamId, "KAM", "req-x"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void completeVisit_alreadyCompleted_throwsIllegalStateTransition() {
        UUID visitId = UUID.randomUUID();
        UUID kamId = UUID.randomUUID();

        VisitEntity existing = new VisitEntity();
        existing.setVisitId(visitId);
        existing.setKamId(kamId);
        existing.setStatus("COMPLETED");

        when(visitRepository.findById(visitId)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() ->
                service.completeVisit(visitId, CompleteVisitCommand.builder().build(),
                        kamId, "KAM", "req-x"))
                .isInstanceOf(IllegalStateTransitionException.class)
                .hasMessageContaining("COMPLETED");
    }

    @Test
    void completeVisit_adminCanCompleteAnyVisit() {
        UUID visitId = UUID.randomUUID();
        UUID ownerKamId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();

        VisitEntity existing = new VisitEntity();
        existing.setVisitId(visitId);
        existing.setKamId(ownerKamId);
        existing.setStatus("CHECKED_IN");
        existing.setCheckInAt(Instant.now().minusSeconds(300));

        when(visitRepository.findById(visitId)).thenReturn(Optional.of(existing));
        when(visitRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        VisitEntity result = service.completeVisit(visitId,
                CompleteVisitCommand.builder().isProductive(false).build(),
                adminId, "ADMIN", "req-admin");

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
    }
}
