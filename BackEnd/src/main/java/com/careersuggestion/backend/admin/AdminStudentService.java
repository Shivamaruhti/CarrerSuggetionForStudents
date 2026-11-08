package com.careersuggestion.backend.admin;

import com.careersuggestion.backend.student.StudentAccount;
import com.careersuggestion.backend.student.StudentAccountRepository;
import com.careersuggestion.backend.student.StudentStatus;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminStudentService {

    private final StudentAccountRepository repository;
    private final PasswordEncoder passwordEncoder;

    public AdminStudentService(StudentAccountRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<StudentAccount> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public StudentAccount create(CreateStudentRequest request) {
        if (repository.existsByPhone(request.phone())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this phone number already exists.");
        }
        StudentAccount student = new StudentAccount(
                request.fullName().trim(), request.phone(), passwordEncoder.encode(request.password()));
        student.updateProfile(student.getFullName(), student.getPhone(),
                request.status() == null ? StudentStatus.ACTIVE : request.status(), null);
        return repository.save(student);
    }

    @Transactional
    public StudentAccount update(Long id, UpdateStudentRequest request) {
        StudentAccount student = findById(id);
        repository.findByPhone(request.phone()).filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, "An account with this phone number already exists.");
                });
        String passwordHash = request.password() == null || request.password().isBlank()
                ? null : passwordEncoder.encode(request.password());
        student.updateProfile(request.fullName().trim(), request.phone(), request.status(), passwordHash);
        return student;
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private StudentAccount findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student account not found."));
    }

    public record CreateStudentRequest(
            String fullName, String phone, String password, StudentStatus status) {
    }

    public record UpdateStudentRequest(
            String fullName, String phone, StudentStatus status, String password) {
    }
}
