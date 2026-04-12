package com.cars24.crmapi.repository;

import com.cars24.crmapi.CrmApiApplication;
import com.cars24.crmcore.entity.LeadEntity;
import com.cars24.crmcore.repository.postgres.LeadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = CrmApiApplication.class)
@ActiveProfiles("test")
class LeadRepositoryIntegrationTest {

    @Autowired
    private LeadRepository leadRepository;

    @BeforeEach
    void setUp() {
        leadRepository.deleteAll();

        leadRepository.save(createLead("L001", "D001", "John Doe", "NGS", "Inspection", "Active", "kam1"));
        leadRepository.save(createLead("L002", "D001", "Jane Smith", "GS", "Token", "Active", "kam1"));
        leadRepository.save(createLead("L003", "D002", "Bob Wilson", "NGS", "Inspection", "Closed", "kam2"));
    }

    @Test
    void findByLeadId_existing_returnsLead() {
        Optional<LeadEntity> result = leadRepository.findByLeadId("L001");
        assertTrue(result.isPresent());
        assertEquals("John Doe", result.get().getCustomerName());
    }

    @Test
    void findByDealerCode_returnsMatchingLeads() {
        var leads = leadRepository.findByDealerCode("D001");
        assertEquals(2, leads.size());
    }

    @Test
    void findFiltered_byChannel_filtersCorrectly() {
        Page<LeadEntity> result = leadRepository.findFiltered(null, null, "NGS", null, null, null, PageRequest.of(0, 10));
        assertEquals(2, result.getTotalElements());
    }

    @Test
    void findFiltered_byStatus_filtersCorrectly() {
        Page<LeadEntity> result = leadRepository.findFiltered(null, null, null, "Active", null, null, PageRequest.of(0, 10));
        assertEquals(2, result.getTotalElements());
    }

    @Test
    void findFiltered_byStage_filtersCorrectly() {
        Page<LeadEntity> result = leadRepository.findFiltered(null, null, null, null, "Token", null, PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void findFiltered_bySearch_matchesCustomerName() {
        Page<LeadEntity> result = leadRepository.findFiltered(null, null, null, null, null, "john", PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void findFiltered_byKamId_filtersCorrectly() {
        Page<LeadEntity> result = leadRepository.findFiltered(null, "kam1", null, null, null, null, PageRequest.of(0, 10));
        assertEquals(2, result.getTotalElements());
    }

    @Test
    void findFiltered_combinedFilters() {
        Page<LeadEntity> result = leadRepository.findFiltered("D001", "kam1", "NGS", "Active", "Inspection", null, PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
        assertEquals("L001", result.getContent().get(0).getLeadId());
    }

    private LeadEntity createLead(String leadId, String dealerCode, String customerName,
                                  String channel, String stage, String status, String kamId) {
        LeadEntity lead = new LeadEntity();
        lead.setLeadId(leadId);
        lead.setDealerCode(dealerCode);
        lead.setCustomerName(customerName);
        lead.setChannel(channel);
        lead.setStage(stage);
        lead.setStatus(status);
        lead.setKamId(kamId);
        lead.setCreatedAt(Instant.now());
        lead.setUpdatedAt(Instant.now());
        return lead;
    }
}
