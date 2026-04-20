package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.VisitEntity;
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
public interface VisitRepository extends JpaRepository<VisitEntity, UUID> {

    List<VisitEntity> findByKamId(UUID kamId);

    List<VisitEntity> findByDealerCode(String dealerCode);

    Page<VisitEntity> findByKamId(UUID kamId, Pageable pageable);

    @Query("SELECT COUNT(v) FROM VisitEntity v WHERE v.kamId = :kamId AND v.createdAt BETWEEN :startDate AND :endDate")
    long countByKamIdBetweenDates(@Param("kamId") UUID kamId,
                                  @Param("startDate") Instant startDate,
                                  @Param("endDate") Instant endDate);
}
