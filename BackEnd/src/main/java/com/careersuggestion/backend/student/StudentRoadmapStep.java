package com.careersuggestion.backend.student;

import com.careersuggestion.backend.catalog.EducationCourse;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(name = "student_roadmap_step",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_roadmap_student_course", columnNames = {"student_id", "course_id"}))
public class StudentRoadmapStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentAccount student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private EducationCourse course;

    @Column(nullable = false)
    private boolean completed;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected StudentRoadmapStep() {
    }

    public StudentRoadmapStep(StudentAccount student, EducationCourse course) {
        this.student = student;
        this.course = course;
        this.createdAt = Instant.now();
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public Long getId() { return id; }
    public EducationCourse getCourse() { return course; }
    public boolean isCompleted() { return completed; }
    public Instant getCreatedAt() { return createdAt; }
}
