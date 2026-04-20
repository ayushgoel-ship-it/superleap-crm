package com.cars24.crmapi.service;

import com.cars24.crmcore.entity.IncentiveRuleEntity;
import com.cars24.crmcore.entity.IncentiveSlabEntity;
import com.cars24.crmcore.repository.postgres.IncentiveRuleRepository;
import com.cars24.crmcore.repository.postgres.IncentiveSlabRepository;
import com.cars24.crmcore.service.impl.ConfigQueryServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConfigQueryServiceImplTest {

    @Mock private IncentiveSlabRepository slabRepository;
    @Mock private IncentiveRuleRepository ruleRepository;
    @InjectMocks private ConfigQueryServiceImpl service;

    @Test
    void listSlabs_all() {
        when(slabRepository.findAll()).thenReturn(List.of(new IncentiveSlabEntity()));
        assertThat(service.listSlabs(null, null)).hasSize(1);
        verify(slabRepository).findAll();
    }

    @Test
    void listSlabs_byMetricKey() {
        when(slabRepository.findByMetricKey("si_count")).thenReturn(List.of(new IncentiveSlabEntity()));
        assertThat(service.listSlabs("si_count", null)).hasSize(1);
        verify(slabRepository).findByMetricKey("si_count");
    }

    @Test
    void listRules_all() {
        when(ruleRepository.findAll()).thenReturn(List.of(new IncentiveRuleEntity()));
        assertThat(service.listRules(null, null)).hasSize(1);
        verify(ruleRepository).findAll();
    }

    @Test
    void listRules_byScope() {
        when(ruleRepository.findByScope("KAM")).thenReturn(List.of(new IncentiveRuleEntity()));
        assertThat(service.listRules(null, "KAM")).hasSize(1);
        verify(ruleRepository).findByScope("KAM");
    }
}
