package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.CallEventEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface CallEventRepository extends JpaRepository<CallEventEntity, UUID> {

    List<CallEventEntity> findByKamId(UUID kamId);

    List<CallEventEntity> findByDealerCode(String dealerCode);

    Page<CallEventEntity> findByKamId(UUID kamId, Pageable pageable);

    @Query("SELECT COUNT(c) FROM CallEventEntity c WHERE c.kamId = :kamId AND c.createdAt BETWEEN :startDate AND :endDate")
    long countByKamIdBetweenDates(@Param("kamId") UUID kamId,
                                  @Param("startDate") Instant startDate,
                                  @Param("endDate") Instant endDate);
}
