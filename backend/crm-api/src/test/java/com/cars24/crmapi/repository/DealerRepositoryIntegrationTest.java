package com.cars24.crmapi.repository;

import com.cars24.crmapi.CrmApiApplication;
import com.cars24.crmcore.entity.DealerEntity;
import com.cars24.crmcore.repository.postgres.DealerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = CrmApiApplication.class)
@ActiveProfiles("test")
class DealerRepositoryIntegrationTest {

    @Autowired
    private DealerRepository dealerRepository;

    private UUID kamId;
    private UUID tlId;

    @BeforeEach
    void setUp() {
        dealerRepository.deleteAll();
        kamId = UUID.randomUUID();
        tlId = UUID.randomUUID();

        dealerRepository.save(createDealer("D001", "Alpha Motors", kamId, tlId, "Gold", "Active", "Mumbai"));
        dealerRepository.save(createDealer("D002", "Beta Cars", kamId, tlId, "Silver", "Active", "Delhi"));
        dealerRepository.save(createDealer("D003", "Gamma Auto", UUID.randomUUID(), tlId, "Gold", "Inactive", "Mumbai"));
    }

    @Test
    void findByDealerCode_existing_returnsDealer() {
        Optional<DealerEntity> result = dealerRepository.findByDealerCode("D001");
        assertTrue(result.isPresent());
        assertEquals("Alpha Motors", result.get().getDealerName());
    }

    @Test
    void findByDealerCode_nonExisting_returnsEmpty() {
        Optional<DealerEntity> result = dealerRepository.findByDealerCode("INVALID");
        assertTrue(result.isEmpty());
    }

    @Test
    void findByKamId_returnsMatchingDealers() {
        var dealers = dealerRepository.findByKamId(kamId);
        assertEquals(2, dealers.size());
    }

    @Test
    void findByTlId_returnsAllTeamDealers() {
        var dealers = dealerRepository.findByTlId(tlId);
        assertEquals(3, dealers.size());
    }

    @Test
    void findFiltered_bySegment_filtersCorrectly() {
        Page<DealerEntity> result = dealerRepository.findFiltered(null, null, "Gold", null, null, PageRequest.of(0, 10));
        assertEquals(2, result.getTotalElements());
    }

    @Test
    void findFiltered_byStatus_filtersCorrectly() {
        Page<DealerEntity> result = dealerRepository.findFiltered(null, null, null, "Active", null, PageRequest.of(0, 10));
        assertEquals(2, result.getTotalElements());
    }

    @Test
    void findFiltered_byKamId_filtersCorrectly() {
        Page<DealerEntity> result = dealerRepository.findFiltered(kamId, null, null, null, null, PageRequest.of(0, 10));
        assertEquals(2, result.getTotalElements());
    }

    @Test
    void findFiltered_bySearch_matchesDealerName() {
        Page<DealerEntity> result = dealerRepository.findFiltered(null, null, null, null, "alpha", PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
        assertEquals("D001", result.getContent().get(0).getDealerCode());
    }

    @Test
    void findFiltered_bySearch_matchesDealerCode() {
        Page<DealerEntity> result = dealerRepository.findFiltered(null, null, null, null, "D002", PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void findFiltered_combinedFilters() {
        Page<DealerEntity> result = dealerRepository.findFiltered(kamId, null, "Gold", "Active", null, PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
        assertEquals("D001", result.getContent().get(0).getDealerCode());
    }

    @Test
    void findFiltered_pagination() {
        Page<DealerEntity> page1 = dealerRepository.findFiltered(null, null, null, null, null, PageRequest.of(0, 2));
        assertEquals(2, page1.getContent().size());
        assertEquals(3, page1.getTotalElements());
        assertEquals(2, page1.getTotalPages());
    }

    private DealerEntity createDealer(String code, String name, UUID kam, UUID tl, String segment, String status, String city) {
        DealerEntity dealer = new DealerEntity();
        dealer.setDealerCode(code);
        dealer.setDealerName(name);
        dealer.setKamId(kam);
        dealer.setTlId(tl);
        dealer.setSegment(segment);
        dealer.setStatus(status);
        dealer.setCity(city);
        dealer.setRegion("West");
        dealer.setCreatedAt(Instant.now());
        dealer.setUpdatedAt(Instant.now());
        return dealer;
    }
}
