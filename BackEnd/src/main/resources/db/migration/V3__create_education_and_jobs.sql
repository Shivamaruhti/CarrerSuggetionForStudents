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
