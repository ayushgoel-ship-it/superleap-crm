package com.cars24.crmapi.dto.web.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateTeamRequest {

    @NotBlank
    @JsonProperty("team_name")
    private String teamName;

    private String region;

    private String city;

    @JsonProperty("tl_user_id")
    private UUID tlUserId;
}
