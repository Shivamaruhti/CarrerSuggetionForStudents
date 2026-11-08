package com.careersuggestion.backend.student;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRoadmapRepository extends JpaRepository<StudentRoadmapStep, Long> {

    List<StudentRoadmapStep> findByStudent_IdOrderByCreatedAtAsc(Long studentId);

    Optional<StudentRoadmapStep> findByStudent_IdAndCourse_Id(Long studentId, Long courseId);
}
