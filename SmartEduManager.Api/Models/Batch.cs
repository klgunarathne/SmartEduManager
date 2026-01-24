namespace SmartEduManager.Api.Models;

public class Batch
{
    public int BatchId { get; set; }
    public string BatchCode { get; set; } = null!;
    public int CourseId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Duration { get; set; } // in days or weeks?

    // Navigation properties
    public Course Course { get; set; } = null!;
    public ICollection<Student> Students { get; set; } = new List<Student>();
}
