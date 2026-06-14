using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.DTOs;

public class ExamDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int TotalMarks { get; set; }
    public int QuestionCount { get; set; }
    public int Duration { get; set; }
    public bool IsActive { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class CreateExamDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public int Duration { get; set; } = 60;
}

public class ExamQuestionDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public int QuestionId { get; set; }
    public int Order { get; set; }
    public QuestionDto? Question { get; set; }
}

public class AddQuestionToExamDto
{
    public int QuestionId { get; set; }
}

public class ScheduleExamDto
{
    public DateTime? AvailableFrom { get; set; }
    public DateTime? AvailableTo { get; set; }
    public string? TimeZone { get; set; }
}