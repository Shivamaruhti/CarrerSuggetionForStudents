package com.careersuggestion.backend.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminAuthController {

    private final AdminTokenService adminTokenService;

    public AdminAuthController(AdminTokenService adminTokenService) {
        this.adminTokenService = adminTokenService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return new LoginResponse(
                adminTokenService.authenticate(request.adminId().trim(), request.password()),
                request.adminId().trim());
    }

    public record LoginRequest(@NotBlank String adminId, @NotBlank String password) {
    }

    public record LoginResponse(String token, String adminId) {
    }
}
