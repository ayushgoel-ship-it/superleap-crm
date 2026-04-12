package com.cars24.crmcore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "dealers_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DealerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "dealer_id")
    private UUID dealerId;

    @Column(name = "dealer_code")
    private String dealerCode;

    @Column(name = "dealer_name")
    private String dealerName;

    @Column(name = "phone")
    private String phone;

    @Column(name = "city")
    private String city;

    @Column(name = "region")
    private String region;

    @Column(name = "address")
    private String address;

    @Column(name = "segment")
    private String segment;

    @Column(name = "status")
    private String status;

    @Column(name = "kam_id")
    private UUID kamId;

    @Column(name = "tl_id")
    private UUID tlId;

    @Column(name = "sell_onboarded")
    private String sellOnboarded;

    @Column(name = "dcf_onboarded")
    private String dcfOnboarded;

    @Column(name = "bank_account_status")
    private String bankAccountStatus;

    @Column(name = "is_top")
    private Boolean isTop;

    @Column(name = "metadata")
    private String metadata;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
