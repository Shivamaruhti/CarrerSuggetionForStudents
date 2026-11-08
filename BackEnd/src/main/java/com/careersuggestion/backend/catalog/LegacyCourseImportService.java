package com.careersuggestion.backend.catalog;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Set;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class LegacyCourseImportService {

    private static final Set<String> CATEGORIES = Set.of("after10th", "graduation", "pg");

    private final JdbcTemplate jdbcTemplate;
    private final EducationCourseService educationCourseService;

    public LegacyCourseImportService(
            JdbcTemplate jdbcTemplate, EducationCourseService educationCourseService) {
        this.jdbcTemplate = jdbcTemplate;
        this.educationCourseService = educationCourseService;
    }

    @Transactional
    public ImportedCourse importCourse(String category, LegacyCourseData data) {
        if (data == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course data is required.");
        }
        if (!CATEGORIES.contains(category)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose after10th, graduation, or pg.");
        }
        validateLegacyFieldLengths(category, data);

        String entranceType = data.entranceTypes() == null || data.entranceTypes().isEmpty()
                ? null
                : String.join(", ", data.entranceTypes());
        KeyHolder keyHolder = new GeneratedKeyHolder();
        switch (category) {
            case "after10th" -> jdbcTemplate.update(connection -> {
                PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO `after10th` (`Standard`, `Course_year`, `Branch`, `Entrance_type`, `Test_name`) VALUES (?, ?, ?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS);
                statement.setString(1, data.nextStandard());
                statement.setString(2, data.duration());
                statement.setString(3, data.branch());
                statement.setString(4, entranceType);
                statement.setString(5, data.entranceTestName());
                return statement;
            }, keyHolder);
            case "graduation" -> jdbcTemplate.update(connection -> {
                PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO `graduate` (`Previous_Standard`, `Previous_Branch`, `Standard`, `Course_years`, `Branch`, `Entrance_type`, `Test_name`) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS);
                statement.setString(1, data.previousStandard());
                statement.setString(2, data.previousBranch());
                statement.setString(3, data.nextStandard());
                statement.setString(4, data.duration());
                statement.setString(5, data.branch());
                statement.setString(6, entranceType);
                statement.setString(7, data.entranceTestName());
                return statement;
            }, keyHolder);
            case "pg" -> jdbcTemplate.update(connection -> {
                PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO `pg` (`Previous_course`, `Previous_Branch`, `Standard`, `Course_time`, `Branch`, `Entrance_type`, `Test_name`) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS);
                statement.setString(1, data.previousStandard());
                statement.setString(2, data.previousBranch());
                statement.setString(3, data.nextStandard());
                statement.setString(4, data.duration());
                statement.setString(5, data.branch());
                statement.setString(6, entranceType);
                statement.setString(7, data.entranceTestName());
                return statement;
            }, keyHolder);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported education category.");
        }

        EducationCourse course = educationCourseService.create(new EducationCourseData(
                category,
                data.previousStandard(),
                data.previousBranch(),
                data.nextStandard(),
                data.duration(),
                data.branch(),
                data.entranceTypes() == null ? List.of() : data.entranceTypes(),
                data.entranceTestName(),
                data.description(),
                data.eligibility(),
                data.institution(),
                data.fees(),
                data.careerOptions()));
        Number legacyId = keyHolder.getKey();
        return new ImportedCourse(legacyId == null ? null : legacyId.longValue(), course.getId());
    }

    private static void validateLegacyFieldLengths(String category, LegacyCourseData data) {
        requireValue("Standard", data.nextStandard());
        requireValue("Course duration", data.duration());
        requireValue("Branch", data.branch());
        int previousLimit = category.equals("after10th") ? 0 : category.equals("graduation") ? 100 : 50;
        int courseLimit = category.equals("after10th") ? 50 : category.equals("graduation") ? 100 : 50;
        int branchLimit = category.equals("after10th") ? 70 : category.equals("graduation") ? 100 : 50;
        int optionLimit = category.equals("graduation") ? 100 : 50;
        requireMaxLength("Previous Standard", data.previousStandard(), previousLimit);
        requireMaxLength("Previous Branch", data.previousBranch(), previousLimit);
        requireMaxLength("Standard", data.nextStandard(), courseLimit);
        requireMaxLength("Course duration", data.duration(), courseLimit);
        requireMaxLength("Branch", data.branch(), branchLimit);
        requireMaxLength("Entrance type", data.entranceTypes() == null ? null : String.join(", ", data.entranceTypes()),
                optionLimit);
        requireMaxLength("Test name", data.entranceTestName(), optionLimit);
    }

    private static void requireValue(String label, String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required.");
        }
    }

    private static void requireMaxLength(String label, String value, int maximum) {
        if (maximum > 0 && value != null && value.length() > maximum) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, label + " must be " + maximum + " characters or fewer.");
        }
    }

    public record LegacyCourseData(
            @Size(max = 150) String previousStandard,
            @Size(max = 150) String previousBranch,
            @NotBlank @Size(max = 150) String nextStandard,
            @NotBlank @Size(max = 80) String duration,
            @NotBlank @Size(max = 150) String branch,
            List<@NotBlank String> entranceTypes,
            @Size(max = 200) String entranceTestName,
            String description,
            @Size(max = 200) String eligibility,
            @Size(max = 200) String institution,
            @DecimalMin(value = "0.0") java.math.BigDecimal fees,
            String careerOptions) {
    }

    public record ImportedCourse(Long legacyCourseId, Long courseId) {
    }
}
