package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incentive_slabs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IncentiveSlabEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "slab_id")
    private UUID slabId;

    @Column(name = "slab_name")
    private String slabName;

    @Column(name = "metric_key")
    private String metricKey;

    @Column(name = "min_value")
    private BigDecimal minValue;

    @Column(name = "max_value")
    private BigDecimal maxValue;

    @Column(name = "payout_amount")
    private BigDecimal payoutAmount;

    @Column(name = "payout_type")
    private String payoutType;

    @Column(name = "role_scope")
    private String roleScope;

    @Column(name = "effective_from")
    private Instant effectiveFrom;

    @Column(name = "effective_to")
    private Instant effectiveTo;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
