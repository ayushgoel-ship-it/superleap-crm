package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "dcf_timeline_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DcfTimelineEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "event_id")
    private UUID eventId;

    @Column(name = "dcf_id")
    private String dcfId;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "event_payload")
    private String eventPayload;

    @Column(name = "actor_user_id")
    private UUID actorUserId;

    @Column(name = "created_at")
    private Instant createdAt;
}
