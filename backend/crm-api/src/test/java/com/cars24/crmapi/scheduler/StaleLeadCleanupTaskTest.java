package com.cars24.crmapi.scheduler;

import com.cars24.crmcore.entity.LeadEntity;
import com.cars24.crmcore.repository.postgres.LeadRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class StaleLeadCleanupTaskTest {

    @Mock
    private LeadRepository leadRepository;

    private StaleLeadCleanupTask task;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        task = new StaleLeadCleanupTask(leadRepository, new SimpleMeterRegistry());
    }

    @Test
    void markStaleLeads_updatesStatusAndRag() {
        LeadEntity staleLead = new LeadEntity();
        staleLead.setLeadId("LEAD-001");
        staleLead.setStatus("active");
        staleLead.setUpdatedAt(Instant.now().minus(45, ChronoUnit.DAYS));

        when(leadRepository.findStaleLeads(any(), any())).thenReturn(List.of(staleLead));
        when(leadRepository.save(any())).thenReturn(staleLead);

        task.markStaleLeads();

        ArgumentCaptor<LeadEntity> captor = ArgumentCaptor.forClass(LeadEntity.class);
        verify(leadRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("stale");
        assertThat(captor.getValue().getRagStatus()).isEqualTo("RED");
    }

    @Test
    void markStaleLeads_noStaleLeads_noSaves() {
        when(leadRepository.findStaleLeads(any(), any())).thenReturn(Collections.emptyList());

        task.markStaleLeads();

        verify(leadRepository, never()).save(any());
    }

    @Test
    void markStaleLeads_multipleLeads_savesAll() {
        LeadEntity lead1 = new LeadEntity();
        lead1.setStatus("new");
        LeadEntity lead2 = new LeadEntity();
        lead2.setStatus("active");

        when(leadRepository.findStaleLeads(any(), any())).thenReturn(List.of(lead1, lead2));
        when(leadRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        task.markStaleLeads();

        verify(leadRepository, times(2)).save(any());
    }
}
