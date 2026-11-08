package com.careersuggestion.backend.config;

import com.careersuggestion.backend.admin.AdminAuthInterceptor;
import com.careersuggestion.backend.student.StudentAuthInterceptor;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final List<String> allowedOrigins;
    private final AdminAuthInterceptor adminAuthInterceptor;
    private final StudentAuthInterceptor studentAuthInterceptor;

    public WebConfig(
            @Value("${app.cors.allowed-origins}") String allowedOrigins,
            AdminAuthInterceptor adminAuthInterceptor,
            StudentAuthInterceptor studentAuthInterceptor) {
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        this.adminAuthInterceptor = adminAuthInterceptor;
        this.studentAuthInterceptor = studentAuthInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminAuthInterceptor)
                .addPathPatterns("/api/admin/**")
                .excludePathPatterns("/api/admin/login");
        registry.addInterceptor(studentAuthInterceptor)
                .addPathPatterns("/api/student/**");
    }
}
