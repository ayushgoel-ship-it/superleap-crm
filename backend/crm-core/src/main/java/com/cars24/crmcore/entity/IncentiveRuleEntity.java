package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incentive_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IncentiveRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rule_id")
    private UUID ruleId;

    @Column(name = "scope")
    private String scope;

    @Column(name = "metric_key")
    private String metricKey;

    @Column(name = "threshold")
    private BigDecimal threshold;

    @Column(name = "payout")
    private BigDecimal payout;

    @Column(name = "description")
    private String description;

    @Column(name = "effective_from")
    private Instant effectiveFrom;

    @Column(name = "effective_to")
    private Instant effectiveTo;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
