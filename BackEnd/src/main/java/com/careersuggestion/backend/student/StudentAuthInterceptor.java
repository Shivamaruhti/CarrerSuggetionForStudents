package com.careersuggestion.backend.student;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class StudentAuthInterceptor implements HandlerInterceptor {

    private final StudentTokenService tokenService;
    private final StudentAccountRepository studentRepository;

    public StudentAuthInterceptor(
            StudentTokenService tokenService, StudentAccountRepository studentRepository) {
        this.tokenService = tokenService;
        this.studentRepository = studentRepository;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request, HttpServletResponse response, Object handler) {
        String authorization = request.getHeader("Authorization");
        if (authorization != null
                && authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            Long studentId = tokenService.studentId(authorization.substring(7).trim());
            if (studentId != null) {
                Optional<StudentAccount> student = studentRepository.findById(studentId);
                if (student.isPresent()
                        && (student.get().getStatus() == StudentStatus.ACTIVE
                        || student.get().getStatus() == StudentStatus.APPROVED)) {
                    request.setAttribute("studentId", studentId);
                    return true;
                }
            }
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        return false;
    }
}
