CREATE TABLE IF NOT EXISTS student_profile (
    student_id BIGINT NOT NULL,
    qualification VARCHAR(32) NOT NULL,
    stream VARCHAR(100),
    preferred_field VARCHAR(160),
    preferred_location VARCHAR(160),
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (student_id),
    CONSTRAINT fk_profile_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_roadmap_step (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_roadmap_student_course UNIQUE (student_id, course_id),
    CONSTRAINT fk_roadmap_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    CONSTRAINT fk_roadmap_course FOREIGN KEY (course_id) REFERENCES education_course(id) ON DELETE CASCADE,
    INDEX idx_roadmap_student (student_id)
);
