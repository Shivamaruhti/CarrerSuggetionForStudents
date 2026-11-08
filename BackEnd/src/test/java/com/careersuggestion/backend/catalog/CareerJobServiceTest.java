package com.careersuggestion.backend.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(MockitoExtension.class)
class CareerJobServiceTest {

    @Mock
    private CareerJobRepository repository;

    private CareerJobService service;

    @BeforeEach
    void setUp() {
        service = new CareerJobService(repository);
    }

    @Test
    void createsAndUpdatesJobDetails() {
        CareerJobData data = new CareerJobData(
                "Developer", "Example Company", "Hyderabad", "B.Tech",
                "Full time", "Competitive", "Build software", "https://example.com/apply");
        when(repository.save(any(CareerJob.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        CareerJob created = service.create(data);
        when(repository.findById(4L)).thenReturn(Optional.of(created));

        CareerJob updated = service.update(4L, new CareerJobData(
                "Senior Developer", "Example Company", "Remote", "B.Tech",
                "Full time", "Negotiable", "Lead a team", "https://example.com/jobs"));

        assertEquals("Senior Developer", updated.getJobTitle());
        assertEquals("Remote", updated.getLocation());
        assertEquals("https://example.com/jobs", updated.getApplyUrl());
    }

    @Test
    void deletesExistingJob() {
        CareerJob job = new CareerJob(new CareerJobData(
                "Developer", "Company", null, null, null, null, null, null));
        when(repository.findById(5L)).thenReturn(Optional.of(job));

        service.delete(5L);

        verify(repository).delete(job);
    }
}
