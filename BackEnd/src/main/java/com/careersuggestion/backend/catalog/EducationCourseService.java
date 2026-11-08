package com.careersuggestion.backend.catalog;

import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EducationCourseService {

    private static final Set<String> CATEGORIES = Set.of("after10th", "intermediate", "graduation", "pg");
    private static final Set<String> ENTRANCE_TYPES = Set.of("Entrance Test", "Direct Joining");

    private final EducationCourseRepository repository;

    public EducationCourseService(EducationCourseRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<EducationCourse> findAll(String category) {
        if (category == null || category.isBlank()) {
            return repository.findAllByOrderByIdDesc();
        }
        validateCategory(category);
        return repository.findByCategoryOrderByIdDesc(category);
    }

    @Transactional
    public EducationCourse create(EducationCourseData data) {
        validate(data);
        return repository.save(new EducationCourse(data));
    }

    @Transactional
    public EducationCourse update(Long id, EducationCourseData data) {
        validate(data);
        EducationCourse course = findById(id);
        course.update(data);
        return course;
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private EducationCourse findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found."));
    }

    private static void validate(EducationCourseData data) {
        validateCategory(data.category());
        if (data.entranceTypes() != null
                && data.entranceTypes().stream().anyMatch(type -> !ENTRANCE_TYPES.contains(type))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a valid entrance type.");
        }
    }

    private static void validateCategory(String category) {
        if (!CATEGORIES.contains(category)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a valid education category.");
        }
    }
}
