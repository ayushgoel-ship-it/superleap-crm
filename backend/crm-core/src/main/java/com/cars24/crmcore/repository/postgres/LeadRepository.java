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
            "(cast(:dealerCode as string) IS NULL OR l.dealerCode = cast(:dealerCode as string)) AND " +
            "(cast(:kamId as string) IS NULL OR l.kamId = cast(:kamId as string)) AND " +
            "(cast(:channel as string) IS NULL OR l.channel = cast(:channel as string)) AND " +
            "(cast(:status as string) IS NULL OR l.status = cast(:status as string)) AND " +
            "(cast(:stage as string) IS NULL OR l.stage = cast(:stage as string)) AND " +
            "(cast(:search as string) IS NULL OR LOWER(l.customerName) LIKE LOWER(CONCAT('%', cast(:search as string), '%')) OR LOWER(l.leadId) LIKE LOWER(CONCAT('%', cast(:search as string), '%')))")
    Page<LeadEntity> findFiltered(@Param("dealerCode") String dealerCode,
                                  @Param("kamId") String kamId,
                                  @Param("channel") String channel,
                                  @Param("status") String status,
                                  @Param("stage") String stage,
                                  @Param("search") String search,
                                  Pageable pageable);
}
