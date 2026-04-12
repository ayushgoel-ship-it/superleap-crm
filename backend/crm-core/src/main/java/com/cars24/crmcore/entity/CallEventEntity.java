package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "call_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CallEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "call_id")
    private UUID callId;

    @Column(name = "dealer_id")
    private String dealerId;

    @Column(name = "dealer_code")
    private String dealerCode;

    @Column(name = "dealer_name")
    private String dealerName;

    @Column(name = "lead_id")
    private String leadId;

    @Column(name = "kam_id")
    private UUID kamId;

    @Column(name = "tl_id")
    private String tlId;

    @Column(name = "phone")
    private String phone;

    @Column(name = "direction")
    private String direction;

    @Column(name = "call_date")
    private LocalDate callDate;

    @Column(name = "call_time")
    private String callTime;

    @Column(name = "call_start_time")
    private Instant callStartTime;

    @Column(name = "call_end_time")
    private Instant callEndTime;

    @Column(name = "duration")
    private Integer duration;

    @Column(name = "outcome")
    private String outcome;

    @Column(name = "call_status")
    private String callStatus;

    @Column(name = "disposition_code")
    private String dispositionCode;

    @Column(name = "is_productive")
    private Boolean isProductive;

    @Column(name = "productivity_source")
    private String productivitySource;

    @Column(name = "auto_tags")
    private String autoTags;

    @Column(name = "kam_comments")
    private String kamComments;

    @Column(name = "follow_up_tasks")
    private String followUpTasks;

    @Column(name = "recording_url")
    private String recordingUrl;

    @Column(name = "recording_status")
    private String recordingStatus;

    @Column(name = "transcript")
    private String transcript;

    @Column(name = "sentiment_score")
    private BigDecimal sentimentScore;

    @Column(name = "sentiment_label")
    private String sentimentLabel;

    @Column(name = "feedback")
    private String feedback;

    @Column(name = "tl_review")
    private String tlReview;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
