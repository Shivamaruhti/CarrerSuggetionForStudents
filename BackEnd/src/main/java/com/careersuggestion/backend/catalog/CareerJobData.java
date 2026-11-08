package com.careersuggestion.backend.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CareerJobData(
        @NotBlank @Size(max = 160) String jobTitle,
        @NotBlank @Size(max = 160) String company,
        @Size(max = 160) String location,
        @Size(max = 160) String qualification,
        @Size(max = 80) String jobType,
        @Size(max = 120) String salary,
        String description,
        @Size(max = 1000) @Pattern(regexp = "^$|^https?://.+$", message = "Enter a valid http or https application URL")
        String applyUrl) {
}
