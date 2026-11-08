package com.careersuggestion.backend.student;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final StudentAccountService studentAccountService;
    private final StudentTokenService studentTokenService;

    public AuthController(StudentAccountService studentAccountService, StudentTokenService studentTokenService) {
        this.studentAccountService = studentAccountService;
        this.studentTokenService = studentTokenService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse register(@Valid @RequestBody RegisterRequest request) {
        return StudentResponse.from(studentAccountService.register(
                request.fullName().trim(),
                request.phone(),
                request.password()));
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        StudentAccount student = studentAccountService.login(request.phone(), request.password());
        return new LoginResponse(StudentResponse.from(student), studentTokenService.issue(student.getId()));
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Enter a valid 10-digit Indian mobile number")
            String phone,
            @NotBlank @Size(min = 8, max = 72)
            @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,72}$",
                    message = "Password must include an uppercase letter, a lowercase letter, and a number")
            String password) {
    }

    public record LoginRequest(
            @NotBlank @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Enter a valid 10-digit Indian mobile number")
            String phone,
            @NotBlank String password) {
    }

    public record StudentResponse(Long id, String fullName, String phone, StudentStatus status) {

        static StudentResponse from(StudentAccount account) {
            return new StudentResponse(
                    account.getId(),
                    account.getFullName(),
                    account.getPhone(),
                    account.getStatus());
        }

    }

    public record LoginResponse(StudentResponse student, String token) {
    }
}
