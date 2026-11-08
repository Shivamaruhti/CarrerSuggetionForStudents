package com.careersuggestion.backend.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(MockitoExtension.class)
class EducationCourseServiceTest {

    @Mock
    private EducationCourseRepository repository;

    private EducationCourseService service;

    @BeforeEach
    void setUp() {
        service = new EducationCourseService(repository);
    }

    @Test
    void createsCourseWithAllEducationDetails() {
        EducationCourseData data = new EducationCourseData(
                "graduation", "Intermediate", "MPC", "Bachelor of Science", "3 years",
                "Computer Science", List.of("Entrance Test", "Direct Joining"),
                "EAMCET", "Course description", "12th standard", "Example College",
                new BigDecimal("125000.00"), "Software development");
        when(repository.save(any(EducationCourse.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        EducationCourse course = service.create(data);

        assertEquals("graduation", course.getCategory());
        assertEquals("Intermediate", course.getPreviousStandard());
        assertEquals("MPC", course.getPreviousBranch());
        assertEquals("Bachelor of Science", course.getNextStandard());
        assertEquals("3 years", course.getDuration());
        assertEquals("Computer Science", course.getBranch());
        assertEquals("Entrance Test\nDirect Joining", course.getEntranceTypes());
        assertEquals("EAMCET", course.getEntranceTestName());
        assertEquals(new BigDecimal("125000.00"), course.getFees());
    }

    @Test
    void rejectsUnsupportedEducationCategory() {
        EducationCourseData data = new EducationCourseData(
                "unknown", null, null, "Course", "2 years", "Branch",
                List.of("Direct Joining"), null, null, null, null, null, null);

        assertThrows(ResponseStatusException.class, () -> service.create(data));
        verifyNoInteractions(repository);
    }

    @Test
    void updatesExistingCourse() {
        EducationCourse course = new EducationCourse(courseData("after10th", "Intermediate"));
        EducationCourseData updated = courseData("after10th", "Polytechnic");
        when(repository.findById(7L)).thenReturn(Optional.of(course));

        EducationCourse result = service.update(7L, updated);

        assertEquals("Polytechnic", result.getNextStandard());
    }

    private static EducationCourseData courseData(String category, String nextStandard) {
        return new EducationCourseData(
                category, null, null, nextStandard, "2 years", "Science",
                List.of("Direct Joining"), null, null, null, null, null, null);
    }
}
