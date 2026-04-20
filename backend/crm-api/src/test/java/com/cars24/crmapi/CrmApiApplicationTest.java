package com.cars24.crmapi;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(classes = CrmApiApplication.class)
@ActiveProfiles("test")
class CrmApiApplicationTest {

    @Test
    void contextLoads() {
    }
}
