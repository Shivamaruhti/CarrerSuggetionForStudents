package com.careersuggestion.backend.catalog;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminEducationController {

    private final EducationCourseService service;
    private final LegacyCourseImportService legacyCourseImportService;

    public AdminEducationController(
            EducationCourseService service, LegacyCourseImportService legacyCourseImportService) {
        this.service = service;
        this.legacyCourseImportService = legacyCourseImportService;
    }

    @GetMapping("/courses")
    public List<EducationCourseResponse> list(@RequestParam(required = false) String category) {
        return service.findAll(category).stream().map(EducationCourseResponse::from).toList();
    }

    @PostMapping("/courses")
    @ResponseStatus(HttpStatus.CREATED)
    public EducationCourseResponse create(@Valid @RequestBody EducationCourseData data) {
        return EducationCourseResponse.from(service.create(data));
    }

    @PostMapping("/courses/import/{category}")
    @ResponseStatus(HttpStatus.CREATED)
    public LegacyCourseImportService.ImportedCourse importLegacyCourse(
            @PathVariable String category,
            @Valid @RequestBody LegacyCourseImportService.LegacyCourseData data) {
        return legacyCourseImportService.importCourse(category, data);
    }

    @PutMapping("/courses/{id}")
    public EducationCourseResponse update(@PathVariable Long id, @Valid @RequestBody EducationCourseData data) {
        return EducationCourseResponse.from(service.update(id, data));
    }

    @DeleteMapping("/courses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    public record EducationCourseResponse(
            Long id,
            String category,
            String previousStandard,
            String previousBranch,
            String nextStandard,
            String duration,
            String branch,
            List<String> entranceTypes,
            String entranceTestName,
            String description,
            String eligibility,
            String institution,
            java.math.BigDecimal fees,
            String careerOptions) {

        static EducationCourseResponse from(EducationCourse course) {
            List<String> types = course.getEntranceTypes() == null || course.getEntranceTypes().isBlank()
                    ? List.of()
                    : course.getEntranceTypes().lines().toList();
            return new EducationCourseResponse(
                    course.getId(), course.getCategory(), course.getPreviousStandard(),
                    course.getPreviousBranch(), course.getNextStandard(), course.getDuration(),
                    course.getBranch(), types, course.getEntranceTestName(), course.getDescription(),
                    course.getEligibility(), course.getInstitution(), course.getFees(), course.getCareerOptions());
        }
    }
}
