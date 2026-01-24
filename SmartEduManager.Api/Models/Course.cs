namespace SmartEduManager.Api.Models;

public class Course
{
    public int CourseId { get; set; }
    public string CourseName { get; set; } = null!;
    public int Duration { get; set; } // in hours or days?
    public decimal CourseFee { get; set; }
    public int CenterId { get; set; }

    // Navigation properties
    public Center Center { get; set; } = null!;
    public ICollection<CourseInstructor> CourseInstructors { get; set; } = new List<CourseInstructor>();
    public ICollection<Batch> Batches { get; set; } = new List<Batch>();
}
