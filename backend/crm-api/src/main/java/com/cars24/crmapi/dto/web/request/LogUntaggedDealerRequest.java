package com.cars24.crmapi.dto.web.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogUntaggedDealerRequest {

    @NotBlank
    private String phone;

    @NotBlank
    private String name;

    private String city;
    private String region;
    private String address;
    private String notes;
}
