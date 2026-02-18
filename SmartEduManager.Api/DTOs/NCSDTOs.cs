namespace SmartEduManager.Api.DTOs;

public class NCSDto
{
    public int Id { get; set; }
    public string Version { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime UpdatedDate { get; set; }
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public List<ModulesDto> Modules { get; set; } = new List<ModulesDto>();
}

public class CreateNCSDto
{
    public string Version { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime UpdatedDate { get; set; }
    public int CourseId { get; set; }
}

public class UpdateNCSDto
{
    public string? Version { get; set; }
    public string? Name { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public int? CourseId { get; set; }
}
