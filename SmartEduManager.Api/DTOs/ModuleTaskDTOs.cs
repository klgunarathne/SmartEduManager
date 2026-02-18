namespace SmartEduManager.Api.DTOs;

public class ModuleTaskDto
{
    public int Id { get; set; }
    public string TaskNo { get; set; } = string.Empty;
    public string TaskName { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public string ModuleNo { get; set; } = string.Empty;
}

public class CreateModuleTaskDto
{
    public string TaskNo { get; set; } = string.Empty;
    public string TaskName { get; set; } = string.Empty;
    public int ModuleId { get; set; }
}

public class UpdateModuleTaskDto
{
    public string? TaskNo { get; set; }
    public string? TaskName { get; set; }
    public int? ModuleId { get; set; }
}
