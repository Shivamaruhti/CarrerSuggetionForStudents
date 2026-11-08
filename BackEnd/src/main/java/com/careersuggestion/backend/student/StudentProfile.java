package com.careersuggestion.backend.student;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "student_profile")
public class StudentProfile {

    @Id
    @Column(name = "student_id")
    private Long studentId;

    @MapsId
    @OneToOne
    @JoinColumn(name = "student_id")
    private StudentAccount student;

    @Column(name = "qualification", nullable = false, length = 32)
    private String qualification;

    @Column(length = 100)
    private String stream;

    @Column(name = "preferred_field", length = 160)
    private String preferredField;

    @Column(name = "preferred_location", length = 160)
    private String preferredLocation;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected StudentProfile() {
    }

    public StudentProfile(StudentAccount student, String qualification, String stream,
            String preferredField, String preferredLocation) {
        this.student = student;
        update(qualification, stream, preferredField, preferredLocation);
    }

    public void update(String qualification, String stream, String preferredField, String preferredLocation) {
        this.qualification = qualification;
        this.stream = stream;
        this.preferredField = preferredField;
        this.preferredLocation = preferredLocation;
        this.updatedAt = Instant.now();
    }

    public Long getStudentId() { return studentId; }
    public String getQualification() { return qualification; }
    public String getStream() { return stream; }
    public String getPreferredField() { return preferredField; }
    public String getPreferredLocation() { return preferredLocation; }
    public Instant getUpdatedAt() { return updatedAt; }
}
