package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.DcfLeadEntity;
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
public interface DcfLeadRepository extends JpaRepository<DcfLeadEntity, UUID> {

    Optional<DcfLeadEntity> findByDcfId(String dcfId);

    List<DcfLeadEntity> findByDealerCode(String dealerCode);

    @Query("SELECT d FROM DcfLeadEntity d WHERE " +
            "(:dealerCode IS NULL OR d.dealerCode = :dealerCode) AND " +
            "(:currentFunnel IS NULL OR d.currentFunnel = :currentFunnel) AND " +
            "(:currentSubStage IS NULL OR d.currentSubStage = :currentSubStage) AND " +
            "(:ragStatus IS NULL OR d.ragStatus = :ragStatus) AND " +
            "(:search IS NULL OR LOWER(d.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.dcfId) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<DcfLeadEntity> findFiltered(@Param("dealerCode") String dealerCode,
                                     @Param("currentFunnel") String currentFunnel,
                                     @Param("currentSubStage") String currentSubStage,
                                     @Param("ragStatus") String ragStatus,
                                     @Param("search") String search,
                                     Pageable pageable);
}
