package com.careersuggestion.backend.admin;

import com.careersuggestion.backend.student.StudentAccount;
import com.careersuggestion.backend.student.StudentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class AdminStudentController {

    private final AdminStudentService service;

    public AdminStudentController(AdminStudentService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudentResponse> list() {
        return service.findAll().stream().map(StudentResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse create(@Valid @RequestBody CreateStudentRequest request) {
        return StudentResponse.from(service.create(new AdminStudentService.CreateStudentRequest(
                request.fullName(), request.phone(), request.password(), request.status())));
    }

    @PutMapping("/{id}")
    public StudentResponse update(
            @PathVariable Long id, @Valid @RequestBody UpdateStudentRequest request) {
        return StudentResponse.from(service.update(id, new AdminStudentService.UpdateStudentRequest(
                request.fullName(), request.phone(), request.status(), request.password())));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    public record CreateStudentRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Enter a valid 10-digit Indian mobile number")
            String phone,
            @NotBlank @Size(min = 8, max = 72)
            @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,72}$",
                    message = "Password must include uppercase, lowercase, and a number")
            String password,
            StudentStatus status) {
    }

    public record UpdateStudentRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Enter a valid 10-digit Indian mobile number")
            String phone,
            @NotNull StudentStatus status,
            @Pattern(regexp = "^$|^(?=.{8,72}$)(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+$",
                    message = "Password must include uppercase, lowercase, and a number")
            String password) {
    }

    public record StudentResponse(
            Long id, String fullName, String phone, StudentStatus status, Instant createdAt) {

        static StudentResponse from(StudentAccount student) {
            return new StudentResponse(
                    student.getId(), student.getFullName(), student.getPhone(),
                    student.getStatus(), student.getCreatedAt());
        }
    }
}
