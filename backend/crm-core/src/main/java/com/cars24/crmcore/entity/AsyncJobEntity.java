package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "async_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AsyncJobEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "job_id")
    private UUID jobId;

    @Column(name = "job_type")
    private String jobType;

    @Column(name = "status")
    private String status;

    @Column(name = "input_payload")
    private String inputPayload;

    @Column(name = "result_summary")
    private String resultSummary;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at")
    private Instant createdAt;
}
