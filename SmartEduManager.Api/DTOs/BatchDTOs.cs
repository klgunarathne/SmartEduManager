namespace SmartEduManager.Api.DTOs;

public class BatchDto
{
    public int BatchId { get; set; }
    public string BatchCode { get; set; } = null!;
    public int CourseId { get; set; }
    public string CourseName { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Duration { get; set; }
}

public class CreateBatchDto
{
    public string BatchCode { get; set; } = null!;
    public int CourseId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Duration { get; set; }
}

public class UpdateBatchDto
{
    public string? BatchCode { get; set; }
    public int? CourseId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? Duration { get; set; }
}
