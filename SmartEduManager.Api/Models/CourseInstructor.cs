namespace SmartEduManager.Api.Models;

public class CourseInstructor
{
    public int CourseId { get; set; }
    public int InstructorId { get; set; }

    // Navigation properties
    public Course Course { get; set; } = null!;
    public Instructor Instructor { get; set; } = null!;
}
