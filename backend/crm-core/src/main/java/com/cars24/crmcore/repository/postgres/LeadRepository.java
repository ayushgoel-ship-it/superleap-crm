package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.LeadEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeadRepository extends JpaRepository<LeadEntity, UUID> {

    Optional<LeadEntity> findByLeadId(String leadId);

    List<LeadEntity> findByDealerCode(String dealerCode);

    @Query("SELECT l FROM LeadEntity l WHERE l.status IN :statuses AND l.updatedAt < :cutoff")
    List<LeadEntity> findStaleLeads(@Param("statuses") List<String> activeStatuses,
                                    @Param("cutoff") Instant cutoff);

    @Query("SELECT l FROM LeadEntity l WHERE " +
            "(:dealerCode IS NULL OR l.dealerCode = :dealerCode) AND " +
            "(:kamId IS NULL OR l.kamId = :kamId) AND " +
            "(:channel IS NULL OR l.channel = :channel) AND " +
            "(:status IS NULL OR l.status = :status) AND " +
            "(:stage IS NULL OR l.stage = :stage) AND " +
            "(:search IS NULL OR LOWER(l.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(l.leadId) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<LeadEntity> findFiltered(@Param("dealerCode") String dealerCode,
                                  @Param("kamId") String kamId,
                                  @Param("channel") String channel,
                                  @Param("status") String status,
                                  @Param("stage") String stage,
                                  @Param("search") String search,
                                  Pageable pageable);
}
