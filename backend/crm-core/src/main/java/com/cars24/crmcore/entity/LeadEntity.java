package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sell_leads_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LeadEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "lead_id", unique = true)
    private String leadId;

    @Column(name = "dealer_id")
    private String dealerId;

    @Column(name = "dealer_code")
    private String dealerCode;

    @Column(name = "dealer_name")
    private String dealerName;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "channel")
    private String channel;

    @Column(name = "lead_type")
    private String leadType;

    @Column(name = "stage")
    private String stage;

    @Column(name = "status")
    private String status;

    @Column(name = "rag_status")
    private String ragStatus;

    @Column(name = "make")
    private String make;

    @Column(name = "model")
    private String model;

    @Column(name = "`year`")
    private String year;

    @Column(name = "variant")
    private String variant;

    @Column(name = "reg_no")
    private String regNo;

    @Column(name = "city")
    private String city;

    @Column(name = "region")
    private String region;

    @Column(name = "inspection_city")
    private String inspectionCity;

    @Column(name = "growth_zone")
    private String growthZone;

    @Column(name = "gs_flag")
    private String gsFlag;

    @Column(name = "franchise_flag")
    private String franchiseFlag;

    @Column(name = "verified")
    private String verified;

    @Column(name = "expected_revenue")
    private BigDecimal expectedRevenue;

    @Column(name = "actual_revenue")
    private BigDecimal actualRevenue;

    @Column(name = "cep")
    private BigDecimal cep;

    @Column(name = "cep_confidence")
    private String cepConfidence;

    @Column(name = "c24_quote")
    private BigDecimal c24Quote;

    @Column(name = "max_c24_quote")
    private BigDecimal maxC24Quote;

    @Column(name = "target_price")
    private BigDecimal targetPrice;

    @Column(name = "seller_agreed_price")
    private BigDecimal sellerAgreedPrice;

    @Column(name = "bid_amount")
    private BigDecimal bidAmount;

    @Column(name = "current_appt_date")
    private Instant currentApptDate;

    @Column(name = "inspection_date")
    private Instant inspectionDate;

    @Column(name = "token_date")
    private Instant tokenDate;

    @Column(name = "stockin_date")
    private Instant stockinDate;

    @Column(name = "stock_out_date")
    private Instant stockOutDate;

    @Column(name = "final_token_date")
    private Instant finalTokenDate;

    @Column(name = "final_si_date")
    private Instant finalSiDate;

    @Column(name = "latest_ocb_raised_at")
    private Instant latestOcbRaisedAt;

    @Column(name = "converted_at")
    private Instant convertedAt;

    @Column(name = "reg_appt_rank")
    private Integer regApptRank;

    @Column(name = "reg_insp_rank")
    private Integer regInspRank;

    @Column(name = "reg_token_rank")
    private Integer regTokenRank;

    @Column(name = "reg_stockin_rank")
    private Integer regStockinRank;

    @Column(name = "ocb_run_count")
    private Integer ocbRunCount;

    // ── C24 integration fields ──

    @Column(name = "c24_lead_id")
    private String c24LeadId;

    @Column(name = "c24_lead_status")
    private String c24LeadStatus;

    @Column(name = "external_source")
    private String externalSource;

    @Column(name = "fuel_type")
    private String fuelType;

    @Column(name = "transmission")
    private String transmission;

    @Column(name = "ownership")
    private String ownership;

    @Column(name = "kilometers")
    private String kilometers;

    // ── Ownership ──

    @Column(name = "kam_id")
    private String kamId;

    @Column(name = "tl_id")
    private String tlId;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
