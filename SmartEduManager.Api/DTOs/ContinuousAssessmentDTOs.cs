namespace SmartEduManager.Api.DTOs;

public class ContinuousAssessmentDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int ModuleTaskId { get; set; }
    public string AssessmentMark { get; set; } = string.Empty;
    public DateTime? AssessmentDate { get; set; }
    public DateTime? CompetencyDate { get; set; }
    public string? AssessorNotes { get; set; }

    // Additional properties for display purposes
    public string? StudentName { get; set; }
    public string? ModuleTaskName { get; set; }
    public string? ModuleName { get; set; }
}

public class CreateContinuousAssessmentDto
{
    public int StudentId { get; set; }
    public int ModuleTaskId { get; set; }
    public string AssessmentMark { get; set; } = string.Empty;
    public DateTime? AssessmentDate { get; set; }
    public DateTime? CompetencyDate { get; set; }
    public string? AssessorNotes { get; set; }
}

public class UpdateContinuousAssessmentDto
{
    public string AssessmentMark { get; set; } = string.Empty;
    public DateTime? AssessmentDate { get; set; }
    public DateTime? CompetencyDate { get; set; }
    public string? AssessorNotes { get; set; }
}

public class StudentContinuousAssessmentDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string MISNo { get; set; } = string.Empty;
    public List<AssessmentTaskDto> AssessmentTasks { get; set; } = new List<AssessmentTaskDto>();
}

public class AssessmentTaskDto
{
    public int ModuleTaskId { get; set; }
    public string TaskNo { get; set; } = string.Empty;
    public string TaskName { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public string? AssessmentMark { get; set; }
    public DateTime? AssessmentDate { get; set; }
    public DateTime? CompetencyDate { get; set; }
    public string? AssessorNotes { get; set; }
}
