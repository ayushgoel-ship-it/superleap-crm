package com.cars24.crmapi.dto.web.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UnreadCountResponse {

    @JsonProperty("unread_count")
    long unreadCount;
}
