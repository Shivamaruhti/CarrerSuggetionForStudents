package com.careersuggestion.backend.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "education_course")
public class EducationCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 24)
    private String category;

    @Column(name = "previous_standard", length = 100)
    private String previousStandard;

    @Column(name = "previous_branch", length = 150)
    private String previousBranch;

    @Column(name = "next_standard", nullable = false, length = 150)
    private String nextStandard;

    @Column(nullable = false, length = 80)
    private String duration;

    @Column(nullable = false, length = 150)
    private String branch;

    @Column(name = "entrance_types", columnDefinition = "TEXT")
    private String entranceTypes;

    @Column(name = "entrance_test_name", length = 200)
    private String entranceTestName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 200)
    private String eligibility;

    @Column(length = 200)
    private String institution;

    @Column(precision = 12, scale = 2)
    private BigDecimal fees;

    @Column(name = "career_options", columnDefinition = "TEXT")
    private String careerOptions;

    protected EducationCourse() {
    }

    public EducationCourse(EducationCourseData data) {
        update(data);
    }

    public void update(EducationCourseData data) {
        category = data.category();
        previousStandard = data.previousStandard();
        previousBranch = data.previousBranch();
        nextStandard = data.nextStandard();
        duration = data.duration();
        branch = data.branch();
        entranceTypes = data.entranceTypes() == null || data.entranceTypes().isEmpty()
                ? null
                : String.join("\n", data.entranceTypes());
        entranceTestName = data.entranceTestName();
        description = data.description();
        eligibility = data.eligibility();
        institution = data.institution();
        fees = data.fees();
        careerOptions = data.careerOptions();
    }

    public Long getId() { return id; }
    public String getCategory() { return category; }
    public String getPreviousStandard() { return previousStandard; }
    public String getPreviousBranch() { return previousBranch; }
    public String getNextStandard() { return nextStandard; }
    public String getDuration() { return duration; }
    public String getBranch() { return branch; }
    public String getEntranceTypes() { return entranceTypes; }
    public String getEntranceTestName() { return entranceTestName; }
    public String getDescription() { return description; }
    public String getEligibility() { return eligibility; }
    public String getInstitution() { return institution; }
    public BigDecimal getFees() { return fees; }
    public String getCareerOptions() { return careerOptions; }
}
