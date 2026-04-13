package com.cars24.crmcore.dto.command;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Command for creating a lead via Cars24 partners-lead API.
 *
 * <p>This extends the standard CreateLeadCommand with C24-specific fields
 * (vehicle details, pricing, external IDs). The backend proxies the call
 * to C24, then persists the result in sell_leads_master.</p>
 */
@Value
@Builder
public class CreateC24LeadCommand {

    // ── Dealer context ──
    String dealerCode;
    String dealerName;

    // ── Customer ──
    String customerName;
    String customerPhone;
    String leadType;

    // ── Vehicle details ──
    String make;
    String makeId;
    String model;
    String modelId;
    String year;
    String variant;
    String variantId;
    String regNo;
    String fuelType;
    String transmission;
    String ownership;
    String kilometers;

    // ── Location ──
    String state;
    String city;
    String rtoCode;

    // ── Pricing (from C24 estimate-price response) ──
    BigDecimal estimatedPriceMin;
    BigDecimal estimatedPriceMax;
    BigDecimal dealerExpectedPrice;

    // ── C24 response ──
    String c24LeadId;
    String c24LeadStatus;

    // ── Actor ──
    UUID kamId;
    String tlId;
}
