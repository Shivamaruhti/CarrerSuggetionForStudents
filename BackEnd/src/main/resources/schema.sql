CREATE TABLE IF NOT EXISTS student (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_student_phone UNIQUE (phone)
);

CREATE TABLE IF NOT EXISTS education_course (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category VARCHAR(24) NOT NULL,
    previous_standard VARCHAR(100),
    previous_branch VARCHAR(150),
    next_standard VARCHAR(150) NOT NULL,
    duration VARCHAR(80) NOT NULL,
    branch VARCHAR(150) NOT NULL,
    entrance_types TEXT,
    entrance_test_name VARCHAR(200),
    description TEXT,
    eligibility VARCHAR(200),
    institution VARCHAR(200),
    fees DECIMAL(12, 2),
    career_options TEXT,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS after10th (
    Course_id INT NOT NULL AUTO_INCREMENT,
    Standard VARCHAR(50),
    Course_year VARCHAR(50),
    Branch VARCHAR(70),
    Entrance_type VARCHAR(50),
    Test_name VARCHAR(50),
    PRIMARY KEY (Course_id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS graduate (
    Course_id INT NOT NULL AUTO_INCREMENT,
    Previous_Standard VARCHAR(100),
    Previous_Branch VARCHAR(100),
    Standard VARCHAR(100),
    Course_years VARCHAR(100),
    Branch VARCHAR(100),
    Entrance_type VARCHAR(100),
    Test_name VARCHAR(100),
    PRIMARY KEY (Course_id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS pg (
    Course_id INT NOT NULL AUTO_INCREMENT,
    Previous_course VARCHAR(50),
    Previous_Branch VARCHAR(50),
    Standard VARCHAR(50),
    Course_time VARCHAR(50),
    Branch VARCHAR(50),
    Entrance_type VARCHAR(50),
    Test_name VARCHAR(50),
    PRIMARY KEY (Course_id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS career_job (
    id BIGINT NOT NULL AUTO_INCREMENT,
    job_title VARCHAR(160) NOT NULL,
    company VARCHAR(160) NOT NULL,
    location VARCHAR(160),
    qualification VARCHAR(160),
    job_type VARCHAR(80),
    salary VARCHAR(120),
    description TEXT,
    apply_url VARCHAR(1000),
    PRIMARY KEY (id)
);

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
