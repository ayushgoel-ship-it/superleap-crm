package com.cars24.crmapi.service;

import com.cars24.crmcore.dto.PaginatedResponse;
import com.cars24.crmcore.entity.AuditLogEntity;
import com.cars24.crmcore.repository.postgres.AuditLogRepository;
import com.cars24.crmcore.service.impl.AuditQueryServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditQueryServiceImplTest {

    @Mock private AuditLogRepository auditLogRepository;
    @InjectMocks private AuditQueryServiceImpl service;

    @Test
    void listAuditLogs_noFilter() {
        Pageable pageable = PageRequest.of(0, 20);
        AuditLogEntity log = new AuditLogEntity();
        log.setAction("USER_CREATE");

        when(auditLogRepository.findAllByOrderByCreatedAtDesc(pageable))
                .thenReturn(new PageImpl<>(List.of(log), pageable, 1));

        PaginatedResponse<AuditLogEntity> result = service.listAuditLogs(null, null, pageable);
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getTotalItems()).isEqualTo(1);
        verify(auditLogRepository).findAllByOrderByCreatedAtDesc(pageable);
    }

    @Test
    void listAuditLogs_withEntityFilter() {
        Pageable pageable = PageRequest.of(0, 20);
        AuditLogEntity log = new AuditLogEntity();
        log.setAction("TARGET_UPDATE");
        log.setEntityType("targets");
        log.setEntityId("t-123");

        when(auditLogRepository.findByEntityTypeAndEntityId("targets", "t-123", pageable))
                .thenReturn(new PageImpl<>(List.of(log), pageable, 1));

        PaginatedResponse<AuditLogEntity> result = service.listAuditLogs("targets", "t-123", pageable);
        assertThat(result.getItems()).hasSize(1);
        verify(auditLogRepository).findByEntityTypeAndEntityId("targets", "t-123", pageable);
    }
}
