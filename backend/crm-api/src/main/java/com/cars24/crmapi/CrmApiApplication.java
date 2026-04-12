package com.cars24.crmapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication(scanBasePackages = {
        "com.cars24.crmapi",
        "com.cars24.crmcore",
        "com.cars24.crmpipeline",
        "com.cars24.crmnotification"
})
@ConfigurationPropertiesScan(basePackages = {
        "com.cars24.crmapi",
        "com.cars24.crmcore"
})
public class CrmApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(CrmApiApplication.class, args);
    }
}
