package com.careersuggestion.backend.student;

import com.careersuggestion.backend.catalog.CareerJob;
import com.careersuggestion.backend.catalog.CareerJobRepository;
import com.careersuggestion.backend.catalog.EducationCourse;
import com.careersuggestion.backend.catalog.EducationCourseData;
import com.careersuggestion.backend.catalog.EducationCourseRepository;
import com.careersuggestion.backend.catalog.EducationCourseService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/student")
public class StudentJourneyController {

    private final StudentAccountRepository students;
    private final StudentProfileRepository profiles;
    private final StudentRoadmapRepository roadmap;
    private final EducationCourseRepository courses;
    private final EducationCourseService courseService;
    private final JdbcTemplate jdbcTemplate;
    private final CareerJobRepository jobs;
    private final StudentAccountService accounts;

    public StudentJourneyController(StudentAccountRepository students, StudentProfileRepository profiles,
            StudentRoadmapRepository roadmap, EducationCourseRepository courses, CareerJobRepository jobs,
            StudentAccountService accounts, EducationCourseService courseService, JdbcTemplate jdbcTemplate) {
        this.students = students;
        this.profiles = profiles;
        this.roadmap = roadmap;
        this.courses = courses;
        this.courseService = courseService;
        this.jdbcTemplate = jdbcTemplate;
        this.jobs = jobs;
        this.accounts = accounts;
    }

    @GetMapping("/account")
    public AccountResponse getAccount(HttpServletRequest request) {
        StudentAccount student = students.findById(studentId(request))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Student account not found."));
        return AccountResponse.from(student);
    }

    @PutMapping("/account")
    public AccountResponse updateAccount(
            HttpServletRequest request, @Valid @RequestBody AccountRequest data) {
        StudentAccount student = accounts.updateDetails(studentId(request),
                data.fullName().trim(), data.phone());
        return AccountResponse.from(student);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            HttpServletRequest request, @Valid @RequestBody PasswordRequest data) {
        accounts.changePassword(studentId(request), data.currentPassword(), data.newPassword());
    }

    @GetMapping("/profile")
    public ProfileResponse getProfile(HttpServletRequest request) {
        Long studentId = studentId(request);
        return profiles.findByStudentId(studentId)
                .map(ProfileResponse::from)
                .orElseGet(() -> new ProfileResponse(studentId, null, "", "", "", null));
    }

    @PutMapping("/profile")
    @Transactional
    public ProfileResponse saveProfile(
            HttpServletRequest request, @Valid @RequestBody ProfileRequest data) {
        Long studentId = studentId(request);
        StudentAccount student = students.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Student account not found."));
        StudentProfile profile = profiles.findByStudentId(studentId)
                .orElseGet(() -> new StudentProfile(student, data.qualification(), data.stream(),
                        data.preferredField(), data.preferredLocation()));
        profile.update(data.qualification(), emptyToNull(data.stream()),
                emptyToNull(data.preferredField()), emptyToNull(data.preferredLocation()));
        return ProfileResponse.from(profiles.save(profile));
    }

    @GetMapping("/courses")
    @Transactional(readOnly = true)
    public List<CourseResponse> recommendations(
            HttpServletRequest request,
            @RequestParam(name = "category", required = false) String targetCategory,
            @RequestParam(name = "previousStandard", required = false) String previousStandard,
            @RequestParam(name = "previousBranch", required = false) String previousBranch) {
        if (targetCategory != null && !targetCategory.isBlank()) {
            if (!List.of("after10th", "intermediate", "graduation", "pg").contains(targetCategory)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a valid education category.");
            }

            if (previousStandard == null || previousStandard.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The previous standard is required.");
            }
            String expectedStandard = previousStandard.trim().toLowerCase(Locale.ROOT);
            String expectedBranch = previousBranch == null ? "" : previousBranch.trim().toLowerCase(Locale.ROOT);
            return courses.findByCategoryOrderByIdDesc(targetCategory).stream()
                    .filter(course -> matches(course.getPreviousStandard(), expectedStandard))
                    .filter(course -> expectedBranch.isEmpty()
                            || matches(course.getPreviousBranch(), expectedBranch))
                    .map(CourseResponse::from)
                    .toList();
        }
        StudentProfile profile = profiles.findByStudentId(studentId(request))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Complete your qualification profile first."));
        String category = switch (profile.getQualification()) {
            case "CLASS_10" -> "after10th";
            case "CLASS_12", "DIPLOMA" -> "graduation";
            case "GRADUATION", "POST_GRADUATION" -> "pg";
            default -> "";
        };
        if (category.isEmpty()) {
            return List.of();
        }
        return courses.findByCategoryOrderByIdDesc(category).stream()
                .filter(course -> isEligible(course, profile))
                .map(CourseResponse::from)
                .toList();
    }

    @GetMapping("/courses/after10th")
    @Transactional(readOnly = true)
    public List<CourseResponse> after10thCourses() {
        return jdbcTemplate.query(
                "SELECT * FROM after10th ORDER BY Course_id DESC",
                (result, row) -> new CourseResponse(
                        result.getLong("Course_id"),
                        "after10th",
                        null,
                        null,
                        result.getString("Standard"),
                        result.getString("Course_year"),
                        result.getString("Branch"),
                        splitEntranceDisplay(result.getString("Entrance_type")),
                        result.getString("Test_name"),
                        null,
                        null,
                        null,
                        null,
                        null,
                        result.getLong("Course_id")));
    }

    @GetMapping("/jobs")
    @Transactional(readOnly = true)
    public List<JobResponse> recommendedJobs(HttpServletRequest request,
            @RequestParam(name = "qualification", required = false) String qualification,
            @RequestParam(name = "branch", required = false) String branch) {
        String eligibleQualification = qualification == null || qualification.isBlank()
                ? profiles.findByStudentId(studentId(request))
                .map(StudentProfile::getQualification)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Complete your qualification profile first."))
                : qualification.trim();
        List<String> terms = qualificationTerms(eligibleQualification);
        if (branch != null && !branch.isBlank()) {
            terms = new java.util.ArrayList<>(terms);
            terms.add(branch.trim().toLowerCase(Locale.ROOT));
        }
        List<String> eligibilityTerms = terms;
        return jobs.findAll().stream()
                .filter(job -> job.getQualification() == null || job.getQualification().isBlank()
                        || eligibilityTerms.stream().anyMatch(term ->
                                job.getQualification().toLowerCase(Locale.ROOT).contains(term)))
                .map(JobResponse::from)
                .toList();
    }

    @GetMapping("/roadmap")
    @Transactional(readOnly = true)
    public List<RoadmapResponse> getRoadmap(HttpServletRequest request) {
        return roadmap.findByStudent_IdOrderByCreatedAtAsc(studentId(request)).stream()
                .map(RoadmapResponse::from)
                .toList();
    }

    @PostMapping("/roadmap/{courseId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public RoadmapResponse addRoadmapStep(HttpServletRequest request, @PathVariable Long courseId) {
        Long studentId = studentId(request);
        return roadmap.findByStudent_IdAndCourse_Id(studentId, courseId)
                .map(RoadmapResponse::from)
                .orElseGet(() -> {
                    StudentAccount student = students.findById(studentId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Student account not found."));
                    EducationCourse course = courses.findById(courseId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found."));
                    return RoadmapResponse.from(roadmap.save(new StudentRoadmapStep(student, course)));
                });
    }

    @PostMapping("/roadmap/after10th/{legacyCourseId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public RoadmapResponse addAfter10thRoadmapStep(
            HttpServletRequest request, @PathVariable Long legacyCourseId) {
        Long studentId = studentId(request);
        After10thCourse legacy = jdbcTemplate.query(
                "SELECT * FROM after10th WHERE Course_id = ?",
                (result, row) -> new After10thCourse(
                        result.getString("Standard"),
                        result.getString("Course_year"),
                        result.getString("Branch"),
                        result.getString("Entrance_type"),
                        result.getString("Test_name")),
                legacyCourseId).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "After 10th course not found."));
        List<String> entranceTypes = parseEntranceTypes(legacy.entranceType());
        EducationCourse course = courses.findByCategoryOrderByIdDesc("after10th").stream()
                .filter(item -> same(item.getNextStandard(), legacy.standard())
                        && same(item.getDuration(), legacy.courseYear())
                        && same(item.getBranch(), legacy.branch())
                        && parseEntranceTypes(item.getEntranceTypes()).equals(entranceTypes)
                        && same(item.getEntranceTestName(), legacy.testName()))
                .findFirst()
                .orElseGet(() -> courseService.create(new EducationCourseData(
                        "after10th", null, null, legacy.standard(), legacy.courseYear(), legacy.branch(),
                        entranceTypes, emptyToNull(legacy.testName()), null, null, null, null, null)));
        return roadmap.findByStudent_IdAndCourse_Id(studentId, course.getId())
                .map(RoadmapResponse::from)
                .orElseGet(() -> {
                    StudentAccount student = students.findById(studentId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Student account not found."));
                    return RoadmapResponse.from(roadmap.save(new StudentRoadmapStep(student, course)));
                });
    }

    @PatchMapping("/roadmap/{courseId}")
    @Transactional
    public RoadmapResponse updateRoadmapStep(HttpServletRequest request, @PathVariable Long courseId,
            @Valid @RequestBody ProgressRequest progress) {
        StudentRoadmapStep step = roadmap.findByStudent_IdAndCourse_Id(studentId(request), courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Roadmap step not found."));
        step.setCompleted(progress.completed());
        return RoadmapResponse.from(step);
    }

    @DeleteMapping("/roadmap/{courseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteRoadmapStep(HttpServletRequest request, @PathVariable Long courseId) {
        StudentRoadmapStep step = roadmap.findByStudent_IdAndCourse_Id(studentId(request), courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Roadmap step not found."));
        roadmap.delete(step);
    }

    private static Long studentId(HttpServletRequest request) {
        return (Long) request.getAttribute("studentId");
    }

    public record AccountRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Pattern(regexp = "^[6-9][0-9]{9}$",
                    message = "Enter a valid 10-digit Indian mobile number") String phone) {
    }

    public record PasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 72)
            @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,72}$",
                    message = "Password must include an uppercase letter, a lowercase letter, and a number")
            String newPassword) {
    }

    public record AccountResponse(Long id, String fullName, String phone, StudentStatus status, Instant createdAt) {

        static AccountResponse from(StudentAccount student) {
            return new AccountResponse(student.getId(), student.getFullName(), student.getPhone(),
                    student.getStatus(), student.getCreatedAt());
        }
    }

    private static boolean isEligible(EducationCourse course, StudentProfile profile) {
        String previousStandard = course.getPreviousStandard();
        if (previousStandard == null || previousStandard.isBlank()) {
            return true;
        }
        String expected = switch (profile.getQualification()) {
            case "CLASS_10" -> "10";
            case "CLASS_12" -> "intermediate";
            case "DIPLOMA" -> "diploma";
            case "GRADUATION", "POST_GRADUATION" -> "";
            default -> "";
        };
        return expected.isEmpty() || previousStandard.toLowerCase(Locale.ROOT).contains(expected);
    }

    private static boolean matches(String actual, String expected) {
        return actual != null && actual.toLowerCase(Locale.ROOT).contains(expected);
    }

    private static List<String> qualificationTerms(String qualification) {
        return switch (qualification) {
            case "CLASS_10" -> List.of("10", "10th", "class x");
            case "CLASS_12" -> List.of("12", "12th", "intermediate", "higher secondary");
            case "DIPLOMA" -> List.of("diploma");
            case "GRADUATION" -> List.of("graduation", "graduate", "bachelor", "degree");
            case "POST_GRADUATION" -> List.of("post", "master", "ph.d", "phd", "postgraduate");
            default -> List.of(qualification.toLowerCase(Locale.ROOT));
        };
    }

    private static String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static List<String> parseEntranceTypes(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        Set<String> allowed = Set.of("Entrance Test", "Direct Joining");
        return java.util.Arrays.stream(value.split("[,\\r\\n]+"))
                .map(String::trim)
                .filter(allowed::contains)
                .distinct()
                .toList();
    }

    private static List<String> splitEntranceDisplay(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(value.split("[,\\r\\n]+"))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .toList();
    }

    private static boolean same(String left, String right) {
        return left == null ? right == null || right.isBlank()
                : right != null && left.trim().equalsIgnoreCase(right.trim());
    }

    public record ProfileRequest(
            @NotBlank @Pattern(regexp = "CLASS_10|CLASS_12|DIPLOMA|GRADUATION|POST_GRADUATION|OTHER")
            String qualification,
            @Size(max = 100) String stream,
            @Size(max = 160) String preferredField,
            @Size(max = 160) String preferredLocation) {
    }

    public record ProgressRequest(@NotNull Boolean completed) {
    }

    public record ProfileResponse(Long studentId, String qualification, String stream,
            String preferredField, String preferredLocation, Instant updatedAt) {
        static ProfileResponse from(StudentProfile profile) {
            return new ProfileResponse(profile.getStudentId(), profile.getQualification(),
                    profile.getStream(), profile.getPreferredField(), profile.getPreferredLocation(),
                    profile.getUpdatedAt());
        }
    }

    public record CourseResponse(Long id, String category, String previousStandard, String previousBranch,
            String nextStandard, String duration, String branch, List<String> entranceTypes,
            String entranceTestName, String description, String eligibility, String institution,
            BigDecimal fees, String careerOptions, Long legacyCourseId) {
        static CourseResponse from(EducationCourse course) {
            List<String> types = course.getEntranceTypes() == null || course.getEntranceTypes().isBlank()
                    ? List.of() : course.getEntranceTypes().lines().toList();
            return new CourseResponse(course.getId(), course.getCategory(), course.getPreviousStandard(),
                    course.getPreviousBranch(), course.getNextStandard(), course.getDuration(), course.getBranch(),
                    types, course.getEntranceTestName(), course.getDescription(), course.getEligibility(),
                    course.getInstitution(), course.getFees(), course.getCareerOptions(), null);
        }
    }

    private record After10thCourse(
            String standard, String courseYear, String branch, String entranceType, String testName) {
    }

    public record RoadmapResponse(Long courseId, String courseName, String branch, String duration,
            String eligibility, BigDecimal fees, String careerOptions, boolean completed, Instant addedAt) {
        static RoadmapResponse from(StudentRoadmapStep step) {
            EducationCourse course = step.getCourse();
            return new RoadmapResponse(course.getId(), course.getNextStandard(), course.getBranch(),
                    course.getDuration(), course.getEligibility(), course.getFees(), course.getCareerOptions(),
                    step.isCompleted(), step.getCreatedAt());
        }
    }

    public record JobResponse(Long id, String jobTitle, String company, String location, String qualification,
            String jobType, String salary, String description, String applyUrl) {
        static JobResponse from(CareerJob job) {
            return new JobResponse(job.getId(), job.getJobTitle(), job.getCompany(), job.getLocation(),
                    job.getQualification(), job.getJobType(), job.getSalary(), job.getDescription(), job.getApplyUrl());
        }
    }
}
