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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/jobs")
public class AdminJobController {

    private final CareerJobService service;

    public AdminJobController(CareerJobService service) {
        this.service = service;
    }

    @GetMapping
    public List<JobResponse> list() {
        return service.findAll().stream().map(JobResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JobResponse create(@Valid @RequestBody CareerJobData data) {
        return JobResponse.from(service.create(data));
    }

    @PutMapping("/{id}")
    public JobResponse update(@PathVariable Long id, @Valid @RequestBody CareerJobData data) {
        return JobResponse.from(service.update(id, data));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    public record JobResponse(
            Long id, String jobTitle, String company, String location, String qualification,
            String jobType, String salary, String description, String applyUrl) {

        static JobResponse from(CareerJob job) {
            return new JobResponse(job.getId(), job.getJobTitle(), job.getCompany(), job.getLocation(),
                    job.getQualification(), job.getJobType(), job.getSalary(), job.getDescription(),
                    job.getApplyUrl());
        }
    }
}
