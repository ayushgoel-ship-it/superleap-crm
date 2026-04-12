package com.cars24.crmcore.event;

import org.springframework.context.ApplicationEvent;

import java.time.Instant;
import java.util.UUID;

/**
 * Abstract base class for all CRM domain events.
 * Published via Spring ApplicationEventPublisher and consumed by @EventListener beans.
 */
public abstract class CrmEvent extends ApplicationEvent {

    private final String eventType;
    private final UUID actorId;
    private final Instant occurredAt;

    protected CrmEvent(Object source, String eventType, UUID actorId) {
        super(source);
        this.eventType = eventType;
        this.actorId = actorId;
        this.occurredAt = Instant.now();
    }

    public String getEventType() {
        return eventType;
    }

    public UUID getActorId() {
        return actorId;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
