package com.careersuggestion.backend.student;

import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentAccountRepository extends JpaRepository<StudentAccount, Long> {

    boolean existsByPhone(String phone);

    Optional<StudentAccount> findByPhone(String phone);

    List<StudentAccount> findAllByOrderByCreatedAtDesc();
}
