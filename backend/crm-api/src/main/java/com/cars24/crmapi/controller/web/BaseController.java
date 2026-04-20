package com.cars24.crmapi.controller.web;

import com.cars24.crmapi.auth.CrmRequestContextHolder;
import com.cars24.crmapi.auth.RequestContext;

import java.util.UUID;

abstract class BaseController {

    protected String resolveRequestId() {
        RequestContext ctx = CrmRequestContextHolder.get();
        if (ctx != null && ctx.getMetadata() != null && ctx.getMetadata().getRequestId() != null) {
            return ctx.getMetadata().getRequestId();
        }
        return "req-" + UUID.randomUUID();
    }
}
