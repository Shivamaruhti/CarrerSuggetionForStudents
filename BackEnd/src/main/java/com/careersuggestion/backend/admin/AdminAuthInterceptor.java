package com.careersuggestion.backend.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    private final AdminTokenService adminTokenService;

    public AdminAuthInterceptor(AdminTokenService adminTokenService) {
        this.adminTokenService = adminTokenService;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request, HttpServletResponse response, Object handler) {
        String authorization = request.getHeader("Authorization");
        if (authorization != null
                && authorization.regionMatches(true, 0, "Bearer ", 0, 7)
                && adminTokenService.isValid(authorization.substring(7).trim())) {
            return true;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        return false;
    }
}
