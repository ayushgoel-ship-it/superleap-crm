package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.AppointmentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, UUID> {

    Optional<AppointmentEntity> findByAppointmentId(String appointmentId);

    List<AppointmentEntity> findByLeadId(String leadId);

    List<AppointmentEntity> findByC24LeadId(String c24LeadId);

    List<AppointmentEntity> findByDealerCode(String dealerCode);

    @Query("SELECT a FROM AppointmentEntity a WHERE " +
            "(:leadId IS NULL OR a.leadId = :leadId) AND " +
            "(:dealerCode IS NULL OR a.dealerCode = :dealerCode) AND " +
            "(:kamId IS NULL OR a.kamId = :kamId) AND " +
            "(:status IS NULL OR a.status = :status) AND " +
            "(:fromDate IS NULL OR a.scheduledDate >= :fromDate) AND " +
            "(:toDate IS NULL OR a.scheduledDate <= :toDate)")
    Page<AppointmentEntity> findFiltered(@Param("leadId") String leadId,
                                         @Param("dealerCode") String dealerCode,
                                         @Param("kamId") String kamId,
                                         @Param("status") String status,
                                         @Param("fromDate") LocalDate fromDate,
                                         @Param("toDate") LocalDate toDate,
                                         Pageable pageable);
}
