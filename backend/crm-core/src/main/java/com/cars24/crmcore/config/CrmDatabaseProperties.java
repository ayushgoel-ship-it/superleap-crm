package com.cars24.crmcore.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "crm.db")
public class CrmDatabaseProperties {

    private String host;
    private Integer port;
    private String database;
    private String username;
    private String password;
    private String schema;
    private boolean sslEnabled;
}
