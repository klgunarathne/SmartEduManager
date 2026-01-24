namespace SmartEduManager.Api.DTOs;

public class CourseInstructorDto
{
    public int CourseId { get; set; }
    public int InstructorId { get; set; }
    public string CourseName { get; set; } = null!;
    public string InstructorName { get; set; } = null!;
}

public class CreateCourseInstructorDto
{
    public int CourseId { get; set; }
    public int InstructorId { get; set; }
}

public class UpdateCourseInstructorDto
{
    public int? CourseId { get; set; }
    public int? InstructorId { get; set; }
}
