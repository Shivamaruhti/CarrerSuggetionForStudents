package com.careersuggestion.backend.student;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudentAccountService {

    private final StudentAccountRepository repository;
    private final PasswordEncoder passwordEncoder;

    public StudentAccountService(StudentAccountRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public StudentAccount register(String fullName, String phone, String password) {
        if (repository.existsByPhone(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this phone number already exists.");
        }

        return repository.save(new StudentAccount(fullName, phone, passwordEncoder.encode(password)));
    }

    public StudentAccount login(String phone, String password) {
        StudentAccount account = repository.findByPhone(phone)
                .orElseThrow(StudentAccountService::invalidCredentials);

        if (!passwordEncoder.matches(password, account.getPasswordHash())) {
            throw invalidCredentials();
        }
        if (account.getStatus() != StudentStatus.ACTIVE && account.getStatus() != StudentStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This student account is not active.");
        }

        return account;
    }

    @Transactional
    public StudentAccount updateDetails(Long studentId, String fullName, String phone) {
        StudentAccount account = findAccount(studentId);
        if (!account.getPhone().equals(phone)
                && repository.existsByPhone(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this phone number already exists.");
        }
        account.updateProfile(fullName, phone, account.getStatus(), null);
        return repository.save(account);
    }

    @Transactional
    public void changePassword(Long studentId, String currentPassword, String newPassword) {
        StudentAccount account = findAccount(studentId);
        if (!passwordEncoder.matches(currentPassword, account.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your current password is incorrect.");
        }
        account.updateProfile(account.getFullName(), account.getPhone(), account.getStatus(),
                passwordEncoder.encode(newPassword));
        repository.save(account);
    }

    private StudentAccount findAccount(Long studentId) {
        return repository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Student account not found."));
    }

    private static ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid phone number or password.");
    }
}
