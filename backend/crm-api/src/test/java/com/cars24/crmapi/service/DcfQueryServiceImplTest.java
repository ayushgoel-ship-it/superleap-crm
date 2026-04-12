package com.cars24.crmapi.service;

import com.cars24.crmcore.entity.DcfLeadEntity;
import com.cars24.crmcore.entity.DcfTimelineEventEntity;
import com.cars24.crmcore.exception.ResourceNotFoundException;
import com.cars24.crmcore.repository.postgres.DcfLeadRepository;
import com.cars24.crmcore.repository.postgres.DcfTimelineEventRepository;
import com.cars24.crmcore.service.impl.DcfQueryServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DcfQueryServiceImplTest {

    @Mock private DcfLeadRepository dcfLeadRepository;
    @Mock private DcfTimelineEventRepository timelineRepository;
    @InjectMocks private DcfQueryServiceImpl service;

    @Test
    void getDcfDetail_found() {
        DcfLeadEntity entity = new DcfLeadEntity();
        entity.setDcfId("DCF-123");
        when(dcfLeadRepository.findByDcfId("DCF-123")).thenReturn(Optional.of(entity));

        DcfLeadEntity result = service.getDcfDetail("DCF-123");
        assertThat(result.getDcfId()).isEqualTo("DCF-123");
    }

    @Test
    void getDcfDetail_notFound() {
        when(dcfLeadRepository.findByDcfId("DCF-999")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getDcfDetail("DCF-999"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getTimeline_returnsSorted() {
        DcfTimelineEventEntity e1 = new DcfTimelineEventEntity();
        e1.setEventType("ONBOARDING_SUBMITTED");
        when(timelineRepository.findByDcfIdOrderByCreatedAtDesc("DCF-123"))
                .thenReturn(List.of(e1));

        List<DcfTimelineEventEntity> result = service.getTimeline("DCF-123");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEventType()).isEqualTo("ONBOARDING_SUBMITTED");
    }
}
