package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "targets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TargetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "target_id")
    private UUID targetId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "team_id")
    private String teamId;

    @Column(name = "role")
    private String role;

    @Column(name = "period")
    private String period;

    @Column(name = "si_target")
    private Integer siTarget;

    @Column(name = "call_target")
    private Integer callTarget;

    @Column(name = "visit_target")
    private Integer visitTarget;

    @Column(name = "dcf_leads_target")
    private Integer dcfLeadsTarget;

    @Column(name = "dcf_disbursal_target")
    private Integer dcfDisbursalTarget;

    @Column(name = "revenue_target")
    private BigDecimal revenueTarget;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
