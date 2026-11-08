package com.careersuggestion.backend.catalog;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CareerJobService {

    private final CareerJobRepository repository;

    public CareerJobService(CareerJobRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<CareerJob> findAll() {
        return repository.findAll();
    }

    @Transactional
    public CareerJob create(CareerJobData data) {
        return repository.save(new CareerJob(data));
    }

    @Transactional
    public CareerJob update(Long id, CareerJobData data) {
        CareerJob job = findById(id);
        job.update(data);
        return job;
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private CareerJob findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found."));
    }
}
