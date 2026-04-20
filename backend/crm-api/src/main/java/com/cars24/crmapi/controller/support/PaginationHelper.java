package com.cars24.crmapi.controller.support;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Converts 1-based page/page_size query params into Spring's 0-based PageRequest.
 * Legacy API contract: page starts at 1, default page_size is 20, max is 100.
 */
public final class PaginationHelper {

    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    private PaginationHelper() {
    }

    public static Pageable toPageable(Integer page, Integer pageSize) {
        int p = (page == null || page < 1) ? DEFAULT_PAGE : page;
        int ps = (pageSize == null || pageSize < 1) ? DEFAULT_PAGE_SIZE : Math.min(pageSize, MAX_PAGE_SIZE);
        return PageRequest.of(p - 1, ps);
    }

    public static Pageable toPageable(Integer page, Integer pageSize, Sort sort) {
        int p = (page == null || page < 1) ? DEFAULT_PAGE : page;
        int ps = (pageSize == null || pageSize < 1) ? DEFAULT_PAGE_SIZE : Math.min(pageSize, MAX_PAGE_SIZE);
        return PageRequest.of(p - 1, ps, sort);
    }
}
