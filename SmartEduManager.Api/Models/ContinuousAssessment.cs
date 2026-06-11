namespace SmartEduManager.Api.Models;

public class ContinuousAssessment
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int ModuleTaskId { get; set; }
    public string AssessmentMark { get; set; } = string.Empty; // "C" for Competent, "NYC" for Not Yet Competent
    public DateTime? AssessmentDate { get; set; }
    public DateTime? CompetencyDate { get; set; } // Date when competency was achieved (for 'C' status)
    public string? AssessorNotes { get; set; }

    // Navigation properties
    public Student Student { get; set; } = null!;
    public ModuleTask ModuleTask { get; set; } = null!;
}
