namespace SmartEduManager.Api.DTOs;

public class AttendanceDto
{
    public int AttendanceId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = null!;
    public string MISNo { get; set; } = null!;
    public int BatchId { get; set; }
    public string BatchCode { get; set; } = null!;
    public DateTime Date { get; set; }
    public bool IsPresent { get; set; }
    public string? Remarks { get; set; }
}

public class CreateAttendanceDto
{
    public int StudentId { get; set; }
    public int BatchId { get; set; }
    public DateTime Date { get; set; }
    public bool IsPresent { get; set; } = true;
    public string? Remarks { get; set; }
}

public class UpdateAttendanceDto
{
    public bool? IsPresent { get; set; }
    public string? Remarks { get; set; }
}

public class BatchAttendanceSummaryDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = null!;
    public string MISNo { get; set; } = null!;
    public int TotalDays { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public double AttendancePercentage { get; set; }
}