namespace SmartEduManager.Api.Models;

public class Attendance
{
    public int AttendanceId { get; set; }
    public int StudentId { get; set; }
    public int BatchId { get; set; }
    public DateTime Date { get; set; }
    public bool IsPresent { get; set; }
    public string? Remarks { get; set; }

    // Navigation properties
    public Student Student { get; set; } = null!;
    public Batch Batch { get; set; } = null!;
}