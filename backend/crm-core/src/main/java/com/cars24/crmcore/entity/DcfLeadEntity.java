package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "dcf_leads_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DcfLeadEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "dcf_id", unique = true)
    private String dcfId;

    @Column(name = "dealer_id")
    private String dealerId;

    @Column(name = "dealer_code")
    private String dealerCode;

    @Column(name = "dealer_city")
    private String dealerCity;

    @Column(name = "dealer_account")
    private String dealerAccount;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "pan")
    private String pan;

    @Column(name = "reg_no")
    private String regNo;

    @Column(name = "car_value")
    private BigDecimal carValue;

    @Column(name = "loan_amount")
    private BigDecimal loanAmount;

    @Column(name = "roi")
    private BigDecimal roi;

    @Column(name = "tenure")
    private Integer tenure;

    @Column(name = "emi")
    private BigDecimal emi;

    @Column(name = "ltv")
    private BigDecimal ltv;

    @Column(name = "final_offer_ltv")
    private BigDecimal finalOfferLtv;

    @Column(name = "rag_status")
    private String ragStatus;

    @Column(name = "red_flag")
    private String redFlag;

    @Column(name = "risk_bucket")
    private String riskBucket;

    @Column(name = "book_flag")
    private String bookFlag;

    @Column(name = "car_docs_flag")
    private String carDocsFlag;

    @Column(name = "current_funnel")
    private String currentFunnel;

    @Column(name = "current_sub_stage")
    private String currentSubStage;

    @Column(name = "overall_status")
    private String overallStatus;

    @Column(name = "funnel_loan_state")
    private String funnelLoanState;

    @Column(name = "cibil_score")
    private Integer cibilScore;

    @Column(name = "cibil_date")
    private Instant cibilDate;

    @Column(name = "employment_type")
    private String employmentType;

    @Column(name = "monthly_income")
    private BigDecimal monthlyIncome;

    @Column(name = "conversion_owner")
    private String conversionOwner;

    @Column(name = "conversion_email")
    private String conversionEmail;

    @Column(name = "conversion_phone")
    private String conversionPhone;

    @Column(name = "commission_eligible")
    private Boolean commissionEligible;

    @Column(name = "base_commission")
    private BigDecimal baseCommission;

    @Column(name = "booster_applied")
    private BigDecimal boosterApplied;

    @Column(name = "total_commission")
    private BigDecimal totalCommission;

    @Column(name = "disbursal_date")
    private Instant disbursalDate;

    @Column(name = "disbursal_utr")
    private String disbursalUtr;

    @Column(name = "kam_id")
    private String kamId;

    @Column(name = "kam_name")
    private String kamName;

    @Column(name = "tl_id")
    private String tlId;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
