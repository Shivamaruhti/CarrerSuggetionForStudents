package com.careersuggestion.backend.student;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private StudentAccountService accountService;

    @Mock
    private StudentTokenService tokenService;

    @Test
    void returnsStudentAndBearerTokenUsingStudentLoginResponseContract() {
        StudentAccount student = mock(StudentAccount.class);
        when(student.getId()).thenReturn(42L);
        when(student.getFullName()).thenReturn("A Student");
        when(student.getPhone()).thenReturn("9876543210");
        when(student.getStatus()).thenReturn(StudentStatus.ACTIVE);
        when(accountService.login("9876543210", "Password1")).thenReturn(student);
        when(tokenService.issue(42L)).thenReturn("signed-token");
        AuthController controller = new AuthController(accountService, tokenService);

        AuthController.LoginResponse response = controller.login(
                new AuthController.LoginRequest("9876543210", "Password1"));

        assertEquals("A Student", response.student().fullName());
        assertEquals("9876543210", response.student().phone());
        assertEquals("signed-token", response.token());
    }
}
