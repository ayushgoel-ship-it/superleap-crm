package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "location_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LocationRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "request_id")
    private UUID requestId;

    @Column(name = "dealer_id")
    private String dealerId;

    @Column(name = "dealer_name")
    private String dealerName;

    @Column(name = "requested_by")
    private UUID requestedBy;

    @Column(name = "requested_by_name")
    private String requestedByName;

    @Column(name = "old_latitude")
    private BigDecimal oldLatitude;

    @Column(name = "old_longitude")
    private BigDecimal oldLongitude;

    @Column(name = "new_latitude")
    private BigDecimal newLatitude;

    @Column(name = "new_longitude")
    private BigDecimal newLongitude;

    @Column(name = "reason")
    private String reason;

    @Column(name = "status")
    private String status;

    @Column(name = "decided_by")
    private UUID decidedBy;

    @Column(name = "decided_by_name")
    private String decidedByName;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
