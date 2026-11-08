package com.careersuggestion.backend.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "career_job")
public class CareerJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_title", nullable = false, length = 160)
    private String jobTitle;

    @Column(nullable = false, length = 160)
    private String company;

    @Column(length = 160)
    private String location;

    @Column(length = 160)
    private String qualification;

    @Column(name = "job_type", length = 80)
    private String jobType;

    @Column(length = 120)
    private String salary;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "apply_url", length = 1000)
    private String applyUrl;

    protected CareerJob() {
    }

    public CareerJob(CareerJobData data) {
        update(data);
    }

    public void update(CareerJobData data) {
        jobTitle = data.jobTitle().trim();
        company = data.company().trim();
        location = data.location();
        qualification = data.qualification();
        jobType = data.jobType();
        salary = data.salary();
        description = data.description();
        applyUrl = data.applyUrl();
    }

    public Long getId() { return id; }
    public String getJobTitle() { return jobTitle; }
    public String getCompany() { return company; }
    public String getLocation() { return location; }
    public String getQualification() { return qualification; }
    public String getJobType() { return jobType; }
    public String getSalary() { return salary; }
    public String getDescription() { return description; }
    public String getApplyUrl() { return applyUrl; }
}
