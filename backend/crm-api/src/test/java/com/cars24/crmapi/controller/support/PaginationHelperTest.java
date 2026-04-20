package com.cars24.crmapi.controller.support;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import static org.assertj.core.api.Assertions.assertThat;

class PaginationHelperTest {

    @Test
    void defaultsWhenBothNull() {
        Pageable pageable = PaginationHelper.toPageable(null, null);

        assertThat(pageable.getPageNumber()).isEqualTo(0); // 1-based page 1 → 0-based 0
        assertThat(pageable.getPageSize()).isEqualTo(20);
    }

    @Test
    void convertsOneBased_toZeroBased() {
        Pageable pageable = PaginationHelper.toPageable(3, 10);

        assertThat(pageable.getPageNumber()).isEqualTo(2); // page 3 → index 2
        assertThat(pageable.getPageSize()).isEqualTo(10);
    }

    @Test
    void defaultsPage_whenLessThanOne() {
        Pageable pageable = PaginationHelper.toPageable(0, 15);
        assertThat(pageable.getPageNumber()).isEqualTo(0);
        assertThat(pageable.getPageSize()).isEqualTo(15);

        pageable = PaginationHelper.toPageable(-1, 15);
        assertThat(pageable.getPageNumber()).isEqualTo(0);
    }

    @Test
    void defaultsPageSize_whenLessThanOne() {
        Pageable pageable = PaginationHelper.toPageable(1, 0);
        assertThat(pageable.getPageSize()).isEqualTo(20);

        pageable = PaginationHelper.toPageable(1, -5);
        assertThat(pageable.getPageSize()).isEqualTo(20);
    }

    @Test
    void capsPageSize_atMax() {
        Pageable pageable = PaginationHelper.toPageable(1, 500);
        assertThat(pageable.getPageSize()).isEqualTo(100);
    }

    @Test
    void allowsPageSize_atMax() {
        Pageable pageable = PaginationHelper.toPageable(1, 100);
        assertThat(pageable.getPageSize()).isEqualTo(100);
    }

    @Test
    void withSort_preservesSortOrder() {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PaginationHelper.toPageable(2, 25, sort);

        assertThat(pageable.getPageNumber()).isEqualTo(1);
        assertThat(pageable.getPageSize()).isEqualTo(25);
        assertThat(pageable.getSort().getOrderFor("createdAt")).isNotNull();
        assertThat(pageable.getSort().getOrderFor("createdAt").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void withSort_appliesDefaults() {
        Sort sort = Sort.by("name");
        Pageable pageable = PaginationHelper.toPageable(null, null, sort);

        assertThat(pageable.getPageNumber()).isEqualTo(0);
        assertThat(pageable.getPageSize()).isEqualTo(20);
        assertThat(pageable.getSort().isSorted()).isTrue();
    }
}
