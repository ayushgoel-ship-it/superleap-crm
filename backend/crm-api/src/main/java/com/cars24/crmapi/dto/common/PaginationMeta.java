package com.cars24.crmapi.dto.common;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PaginationMeta {

    int page;
    @JsonProperty("page_size")
    int pageSize;
    @JsonProperty("total_items")
    long totalItems;
    @JsonProperty("total_pages")
    int totalPages;
    @JsonProperty("has_next")
    boolean hasNext;
}
