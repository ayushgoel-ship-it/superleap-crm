package com.cars24.crmapi.config;

import com.cars24.crmapi.filter.AuthenticationFilter;
import com.cars24.crmapi.filter.JwtTokenFilter;
import com.cars24.crmapi.filter.LoggingFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class FilterConfig {

    private static final List<String> PROTECTED_URL_PATTERNS = List.of(
            "/web/v1/*",
            "/app/v1/*",
            "/internal/v1/*"
    );

    @Bean
    public FilterRegistrationBean<LoggingFilter> loggingFilterRegistration(LoggingFilter loggingFilter) {
        FilterRegistrationBean<LoggingFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(loggingFilter);
        registrationBean.setUrlPatterns(PROTECTED_URL_PATTERNS);
        registrationBean.setOrder(1);
        return registrationBean;
    }

    @Bean
    public FilterRegistrationBean<JwtTokenFilter> jwtFilterRegistration(JwtTokenFilter jwtTokenFilter) {
        FilterRegistrationBean<JwtTokenFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(jwtTokenFilter);
        registrationBean.setUrlPatterns(PROTECTED_URL_PATTERNS);
        registrationBean.setOrder(2);
        return registrationBean;
    }

    @Bean
    public FilterRegistrationBean<AuthenticationFilter> authenticationFilterRegistration(
            AuthenticationFilter authenticationFilter) {
        FilterRegistrationBean<AuthenticationFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(authenticationFilter);
        registrationBean.setUrlPatterns(PROTECTED_URL_PATTERNS);
        registrationBean.setOrder(3);
        return registrationBean;
    }
}
