namespace SmartEduManager.Api.DTOs;

public class AssignmentDto
{
    public int Id { get; set; }
    public string AssignmentName { get; set; } = string.Empty;
    public string CoveringModule { get; set; } = string.Empty;
}

public class CreateAssignmentDto
{
    public string AssignmentName { get; set; } = string.Empty;
    public string CoveringModule { get; set; } = string.Empty;
}

public class UpdateAssignmentDto
{
    public string AssignmentName { get; set; } = string.Empty;
    public string CoveringModule { get; set; } = string.Empty;
}

public class AssignmentMarksDto
{
    public int Id { get; set; }
    public int Marks { get; set; }
    public DateTime AssignmentDate { get; set; }
    public int AssignmentId { get; set; }
    public int StudentId { get; set; }
    
    // Additional properties for display purposes
    public string? AssignmentName { get; set; }
    public string? StudentName { get; set; }
    public string? CoveringModule { get; set; }
}

public class CreateAssignmentMarksDto
{
    public int Marks { get; set; }
    public DateTime AssignmentDate { get; set; }
    public int AssignmentId { get; set; }
    public int StudentId { get; set; }
}

public class UpdateAssignmentMarksDto
{
    public int Marks { get; set; }
    public DateTime AssignmentDate { get; set; }
}
