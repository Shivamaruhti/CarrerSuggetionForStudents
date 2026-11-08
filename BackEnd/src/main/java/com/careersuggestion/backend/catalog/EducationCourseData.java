package com.careersuggestion.backend.catalog;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record EducationCourseData(
        @NotBlank String category,
        @Size(max = 100) String previousStandard,
        @Size(max = 150) String previousBranch,
        @NotBlank @Size(max = 150) String nextStandard,
        @NotBlank @Size(max = 80) String duration,
        @NotBlank @Size(max = 150) String branch,
        List<@NotBlank String> entranceTypes,
        @Size(max = 200) String entranceTestName,
        String description,
        @Size(max = 200) String eligibility,
        @Size(max = 200) String institution,
        @DecimalMin(value = "0.0") BigDecimal fees,
        String careerOptions) {
}
