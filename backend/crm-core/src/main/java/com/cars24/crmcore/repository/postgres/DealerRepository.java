package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.DealerEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DealerRepository extends JpaRepository<DealerEntity, UUID> {

    Optional<DealerEntity> findByDealerCode(String dealerCode);

    List<DealerEntity> findByKamId(UUID kamId);

    List<DealerEntity> findByTlId(UUID tlId);

    Page<DealerEntity> findByKamId(UUID kamId, Pageable pageable);

    Page<DealerEntity> findByTlId(UUID tlId, Pageable pageable);

    @Query("SELECT d FROM DealerEntity d WHERE " +
            "(:kamId IS NULL OR d.kamId = :kamId) AND " +
            "(:tlId IS NULL OR d.tlId = :tlId) AND " +
            "(:segment IS NULL OR d.segment = :segment) AND " +
            "(:status IS NULL OR d.status = :status) AND " +
            "(:search IS NULL OR LOWER(d.dealerName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.dealerCode) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<DealerEntity> findFiltered(@Param("kamId") UUID kamId,
                                    @Param("tlId") UUID tlId,
                                    @Param("segment") String segment,
                                    @Param("status") String status,
                                    @Param("search") String search,
                                    Pageable pageable);
}
