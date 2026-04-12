package com.cars24.crmapi.auth;

import jakarta.servlet.http.HttpServletRequest;

public final class CrmRequestContextHolder {

    public static final String REQUEST_CONTEXT_ATTRIBUTE = RequestContext.class.getName();
    public static final String REQUEST_ID_ATTRIBUTE = "crm.requestId";

    private static final ThreadLocal<RequestContext> CURRENT_CONTEXT = new ThreadLocal<>();

    private CrmRequestContextHolder() {
    }

    public static void set(RequestContext requestContext) {
        CURRENT_CONTEXT.set(requestContext);
    }

    public static RequestContext get() {
        return CURRENT_CONTEXT.get();
    }

    public static RequestContext getRequired() {
        RequestContext requestContext = CURRENT_CONTEXT.get();
        if (requestContext == null) {
            throw new IllegalStateException("No request context available");
        }
        return requestContext;
    }

    public static void clear() {
        CURRENT_CONTEXT.remove();
    }

    public static RequestContext getFromRequest(HttpServletRequest request) {
        Object attribute = request.getAttribute(REQUEST_CONTEXT_ATTRIBUTE);
        return attribute instanceof RequestContext ? (RequestContext) attribute : null;
    }
}
