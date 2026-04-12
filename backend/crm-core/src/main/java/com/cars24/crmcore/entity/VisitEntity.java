package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "visits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VisitEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "visit_id")
    private UUID visitId;

    @Column(name = "dealer_id")
    private String dealerId;

    @Column(name = "dealer_code")
    private String dealerCode;

    @Column(name = "dealer_name")
    private String dealerName;

    @Column(name = "untagged_dealer_id")
    private String untaggedDealerId;

    @Column(name = "lead_id")
    private String leadId;

    @Column(name = "kam_id")
    private UUID kamId;

    @Column(name = "tl_id")
    private String tlId;

    @Column(name = "visit_date")
    private LocalDate visitDate;

    @Column(name = "visit_time")
    private String visitTime;

    @Column(name = "visit_type")
    private String visitType;

    @Column(name = "status")
    private String status;

    @Column(name = "duration")
    private Integer duration;

    @Column(name = "geo_lat")
    private BigDecimal geoLat;

    @Column(name = "geo_lng")
    private BigDecimal geoLng;

    @Column(name = "checkout_lat")
    private BigDecimal checkoutLat;

    @Column(name = "checkout_lng")
    private BigDecimal checkoutLng;

    @Column(name = "check_in_at")
    private Instant checkInAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "is_productive")
    private Boolean isProductive;

    @Column(name = "productivity_source")
    private String productivitySource;

    @Column(name = "outcomes")
    private String outcomes;

    @Column(name = "kam_comments")
    private String kamComments;

    @Column(name = "follow_up_tasks")
    private String followUpTasks;

    @Column(name = "feedback")
    private String feedback;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
