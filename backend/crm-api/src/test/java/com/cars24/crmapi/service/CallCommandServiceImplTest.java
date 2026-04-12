package com.cars24.crmapi.service;

import com.cars24.crmcore.dto.command.RegisterCallCommand;
import com.cars24.crmcore.dto.command.SubmitCallFeedbackCommand;
import com.cars24.crmcore.entity.CallEventEntity;
import com.cars24.crmcore.exception.ForbiddenException;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.CallEventRepository;
import com.cars24.crmcore.service.impl.CallCommandServiceImpl;
import com.cars24.crmcore.service.internal.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CallCommandServiceImplTest {

    @Mock private CallEventRepository callEventRepository;
    @Mock private AuditService auditService;

    private CallCommandServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CallCommandServiceImpl(callEventRepository, auditService);
    }

    // ── registerCall ──────────────────────────────────────────────────

    @Test
    void registerCall_createsEntityAndSaves() {
        UUID kamId = UUID.randomUUID();
        RegisterCallCommand command = RegisterCallCommand.builder()
                .dealerId("DLR001")
                .dealerCode("DC001")
                .dealerName("Test Dealer")
                .phone("9876543210")
                .direction("outbound")
                .kamId(kamId)
                .callDate(LocalDate.of(2026, 4, 10))
                .callStartTime(Instant.parse("2026-04-10T10:00:00Z"))
                .notes("Test note")
                .build();

        ArgumentCaptor<CallEventEntity> captor = ArgumentCaptor.forClass(CallEventEntity.class);
        when(callEventRepository.save(captor.capture())).thenAnswer(inv -> {
            CallEventEntity e = inv.getArgument(0);
            e.setCallId(UUID.randomUUID());
            return e;
        });

        CallEventEntity result = service.registerCall(command, "req-123");

        assertThat(result.getDealerId()).isEqualTo("DLR001");
        assertThat(result.getDealerCode()).isEqualTo("DC001");
        assertThat(result.getPhone()).isEqualTo("9876543210");
        assertThat(result.getDirection()).isEqualTo("outbound");
        assertThat(result.getKamId()).isEqualTo(kamId);
        assertThat(result.getCallDate()).isEqualTo(LocalDate.of(2026, 4, 10));
        assertThat(result.getCreatedAt()).isNotNull();

        verify(auditService).log(eq(kamId), eq("KAM"), eq("CALL_REGISTER"),
                eq("call_event"), anyString(), isNull(), isNull(), anyString(), eq("req-123"));
    }

    @Test
    void registerCall_defaultsCallDateAndStartTimeWhenNull() {
        RegisterCallCommand command = RegisterCallCommand.builder()
                .dealerId("DLR001")
                .phone("9876543210")
                .direction("outbound")
                .kamId(UUID.randomUUID())
                .build();

        when(callEventRepository.save(any())).thenAnswer(inv -> {
            CallEventEntity e = inv.getArgument(0);
            e.setCallId(UUID.randomUUID());
            return e;
        });

        CallEventEntity result = service.registerCall(command, "req-456");

        assertThat(result.getCallDate()).isEqualTo(LocalDate.now());
        assertThat(result.getCallStartTime()).isNotNull();
    }

    // ── submitFeedback ────────────────────────────────────────────────

    @Test
    void submitFeedback_updatesExistingCall() {
        UUID callId = UUID.randomUUID();
        UUID kamId = UUID.randomUUID();

        CallEventEntity existing = new CallEventEntity();
        existing.setCallId(callId);
        existing.setKamId(kamId);
        existing.setOutcome("pending");

        when(callEventRepository.findById(callId)).thenReturn(Optional.of(existing));
        when(callEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubmitCallFeedbackCommand command = SubmitCallFeedbackCommand.builder()
                .outcome("interested")
                .callStatus("completed")
                .dispositionCode("CALLBACK")
                .isProductive(true)
                .productivitySource("manual")
                .kamComments("Good discussion")
                .duration(300)
                .build();

        CallEventEntity result = service.submitFeedback(callId, command, kamId, "KAM", "req-789");

        assertThat(result.getOutcome()).isEqualTo("interested");
        assertThat(result.getCallStatus()).isEqualTo("completed");
        assertThat(result.getDispositionCode()).isEqualTo("CALLBACK");
        assertThat(result.getIsProductive()).isTrue();
        assertThat(result.getDuration()).isEqualTo(300);
        assertThat(result.getUpdatedAt()).isNotNull();

        verify(auditService).log(eq(kamId), eq("KAM"), eq("CALL_SUBMIT_FEEDBACK"),
                eq("call_event"), eq(callId.toString()), anyString(), anyString(), anyString(), eq("req-789"));
    }

    @Test
    void submitFeedback_callNotFound_throwsResourceNotFound() {
        UUID callId = UUID.randomUUID();
        when(callEventRepository.findById(callId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.submitFeedback(callId, SubmitCallFeedbackCommand.builder()
                        .outcome("interested").build(), UUID.randomUUID(), "KAM", "req-x"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(callId.toString());
    }

    @Test
    void submitFeedback_kamNotOwner_throwsForbidden() {
        UUID callId = UUID.randomUUID();
        UUID ownerKamId = UUID.randomUUID();
        UUID otherKamId = UUID.randomUUID();

        CallEventEntity existing = new CallEventEntity();
        existing.setCallId(callId);
        existing.setKamId(ownerKamId);

        when(callEventRepository.findById(callId)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() ->
                service.submitFeedback(callId, SubmitCallFeedbackCommand.builder()
                        .outcome("interested").build(), otherKamId, "KAM", "req-x"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void submitFeedback_adminCanUpdateAnyCall() {
        UUID callId = UUID.randomUUID();
        UUID ownerKamId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();

        CallEventEntity existing = new CallEventEntity();
        existing.setCallId(callId);
        existing.setKamId(ownerKamId);

        when(callEventRepository.findById(callId)).thenReturn(Optional.of(existing));
        when(callEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CallEventEntity result = service.submitFeedback(callId,
                SubmitCallFeedbackCommand.builder().outcome("not_interested").build(),
                adminId, "ADMIN", "req-admin");

        assertThat(result.getOutcome()).isEqualTo("not_interested");
    }

    @Test
    void submitFeedback_tlCanUpdateAnyCall() {
        UUID callId = UUID.randomUUID();
        UUID ownerKamId = UUID.randomUUID();
        UUID tlId = UUID.randomUUID();

        CallEventEntity existing = new CallEventEntity();
        existing.setCallId(callId);
        existing.setKamId(ownerKamId);

        when(callEventRepository.findById(callId)).thenReturn(Optional.of(existing));
        when(callEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CallEventEntity result = service.submitFeedback(callId,
                SubmitCallFeedbackCommand.builder().outcome("follow_up").build(),
                tlId, "TL", "req-tl");

        assertThat(result.getOutcome()).isEqualTo("follow_up");
    }
}
