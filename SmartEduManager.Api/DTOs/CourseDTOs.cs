namespace SmartEduManager.Api.DTOs;

public class CourseDto
{
    public int CourseId { get; set; }
    public string CourseName { get; set; } = null!;
    public string Description { get; set; } = null!;
    public int Duration { get; set; }
    public decimal CourseFee { get; set; }
    public int CenterId { get; set; }
    public string CenterName { get; set; } = null!;
    public List<int> InstructorIds { get; set; } = new List<int>();
    public List<string> InstructorNames { get; set; } = new List<string>();
    public List<int> BatchIds { get; set; } = new List<int>();
    public List<string> BatchCodes { get; set; } = new List<string>();
    public bool HasInstructors { get; set; }
    public bool HasBatches { get; set; }
}

public class CreateCourseDto
{
    public string CourseName { get; set; } = null!;
    public string Description { get; set; } = null!;
    public int Duration { get; set; }
    public decimal CourseFee { get; set; }
    public int CenterId { get; set; }
}

public class UpdateCourseDto
{
    public string? CourseName { get; set; }
    public string? Description { get; set; }
    public int? Duration { get; set; }
    public decimal? CourseFee { get; set; }
    public int? CenterId { get; set; }
}
