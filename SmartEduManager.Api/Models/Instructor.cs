namespace SmartEduManager.Api.Models;

public class Instructor
{
    public int InstructorId { get; set; }
    public string EPFNo { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string NIC { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;

    // Navigation property
    public ICollection<CourseInstructor> CourseInstructors { get; set; } = new List<CourseInstructor>();
}
