package com.careersuggestion.backend.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EducationCourseRepository extends JpaRepository<EducationCourse, Long> {
    List<EducationCourse> findAllByOrderByIdDesc();
    List<EducationCourse> findByCategoryOrderByIdDesc(String category);
}
