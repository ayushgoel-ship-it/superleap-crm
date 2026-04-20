package com.cars24.crmapi.auth;

import org.springframework.stereotype.Component;

@Component
public class RequestContextAccessor {

    public RequestContext getCurrentContext() {
        return CrmRequestContextHolder.get();
    }

    public RequestContext getRequiredContext() {
        return CrmRequestContextHolder.getRequired();
    }
}
