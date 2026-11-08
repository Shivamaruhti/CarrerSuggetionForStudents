package com.careersuggestion.backend.student;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@ExtendWith(MockitoExtension.class)
class StudentAuthInterceptorTest {

    @Mock
    private StudentTokenService tokenService;

    @Mock
    private StudentAccountRepository studentRepository;

    private StudentAuthInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new StudentAuthInterceptor(tokenService, studentRepository);
    }

    @Test
    void allowsActiveStudentAndSetsAuthenticatedIdentity() throws Exception {
        StudentAccount student = student(StudentStatus.ACTIVE);
        when(tokenService.studentId("valid-token")).thenReturn(42L);
        when(studentRepository.findById(42L)).thenReturn(Optional.of(student));
        MockHttpServletRequest request = request("valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertTrue(interceptor.preHandle(request, response, new Object()));
        assertEquals(Long.valueOf(42L), request.getAttribute("studentId"));
    }

    @Test
    void rejectsPreviouslyIssuedTokenForRejectedAccount() throws Exception {
        when(tokenService.studentId("valid-token")).thenReturn(42L);
        when(studentRepository.findById(42L)).thenReturn(Optional.of(student(StudentStatus.REJECTED)));
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(interceptor.preHandle(request("valid-token"), response, new Object()));
        assertEquals(401, response.getStatus());
        verify(studentRepository).findById(42L);
    }

    @Test
    void rejectsTokenWhoseStudentNoLongerExists() throws Exception {
        when(tokenService.studentId("valid-token")).thenReturn(42L);
        when(studentRepository.findById(42L)).thenReturn(Optional.empty());
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(interceptor.preHandle(request("valid-token"), response, new Object()));
        assertEquals(401, response.getStatus());
    }

    private static MockHttpServletRequest request(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }

    private static StudentAccount student(StudentStatus status) {
        StudentAccount student = new StudentAccount("Test Student", "9876543210", "hash");
        student.updateProfile("Test Student", "9876543210", status, null);
        return student;
    }
}
