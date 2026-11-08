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
