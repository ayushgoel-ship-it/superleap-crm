package com.cars24.crmapi.service;

import com.cars24.crmcore.dto.command.LocationUpdateCommand;
import com.cars24.crmcore.dto.command.LogUntaggedDealerCommand;
import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.entity.UntaggedDealerEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.DealerRepository;
import com.cars24.crmcore.repository.postgres.UntaggedDealerRepository;
import com.cars24.crmcore.service.impl.DealerCommandServiceImpl;
import com.cars24.crmcore.service.internal.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DealerCommandServiceImplTest {

    @Mock private DealerRepository dealerRepository;
    @Mock private UntaggedDealerRepository untaggedDealerRepository;
    @Mock private AuditService auditService;

    private DealerCommandServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new DealerCommandServiceImpl(dealerRepository, untaggedDealerRepository, auditService);
    }

    @Test
    void logUntaggedDealer_createsEntityAndSaves() {
        UUID kamId = UUID.randomUUID();
        LogUntaggedDealerCommand command = LogUntaggedDealerCommand.builder()
                .phone("9876543210")
                .name("New Dealer")
                .city("Delhi")
                .createdBy(kamId)
                .build();

        when(untaggedDealerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UntaggedDealerEntity result = service.logUntaggedDealer(command, "req-100");

        assertThat(result.getId()).isNotNull();
        assertThat(result.getPhone()).isEqualTo("9876543210");
        assertThat(result.getName()).isEqualTo("New Dealer");
        assertThat(result.getCreatedBy()).isEqualTo(kamId);
        assertThat(result.getCreatedAt()).isNotNull();

        verify(auditService).log(eq(kamId), eq("KAM"), eq("DEALER_LOG_UNTAGGED"),
                eq("untagged_dealer"), anyString(), isNull(), isNull(), anyString(), eq("req-100"));
    }

    @Test
    void toggleTopTag_togglesFalseToTrue() {
        DealerEntity existing = new DealerEntity();
        existing.setDealerCode("DLR001");
        existing.setIsTop(false);

        when(dealerRepository.findByDealerCode("DLR001")).thenReturn(Optional.of(existing));
        when(dealerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID actorId = UUID.randomUUID();
        DealerEntity result = service.toggleTopTag("DLR001", actorId, "KAM", "req-200");

        assertThat(result.getIsTop()).isTrue();
        assertThat(result.getUpdatedAt()).isNotNull();
    }

    @Test
    void toggleTopTag_togglesTrueToFalse() {
        DealerEntity existing = new DealerEntity();
        existing.setDealerCode("DLR001");
        existing.setIsTop(true);

        when(dealerRepository.findByDealerCode("DLR001")).thenReturn(Optional.of(existing));
        when(dealerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DealerEntity result = service.toggleTopTag("DLR001", UUID.randomUUID(), "KAM", "req-201");

        assertThat(result.getIsTop()).isFalse();
    }

    @Test
    void toggleTopTag_dealerNotFound_throwsResourceNotFound() {
        when(dealerRepository.findByDealerCode("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.toggleTopTag("MISSING", UUID.randomUUID(), "KAM", "req-x"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void requestLocationUpdate_updatesAddressFields() {
        DealerEntity existing = new DealerEntity();
        existing.setDealerCode("DLR001");
        existing.setAddress("Old Address");

        when(dealerRepository.findByDealerCode("DLR001")).thenReturn(Optional.of(existing));
        when(dealerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LocationUpdateCommand command = LocationUpdateCommand.builder()
                .dealerCode("DLR001")
                .newAddress("New Address 123")
                .newCity("Mumbai")
                .reason("Relocated")
                .build();

        DealerEntity result = service.requestLocationUpdate(command, UUID.randomUUID(), "KAM", "req-300");

        assertThat(result.getAddress()).isEqualTo("New Address 123");
        assertThat(result.getCity()).isEqualTo("Mumbai");
        assertThat(result.getUpdatedAt()).isNotNull();
    }
}
