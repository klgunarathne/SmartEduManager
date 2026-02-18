namespace SmartEduManager.Api.DTOs;

public class ModulesDto
{
    public int Id { get; set; }
    public string ModuleNo { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public int TheoryHours { get; set; } = 0;
    public int PracticalHours { get; set; } = 0;
    public int NCSId { get; set; }
    public List<ModuleTaskDto> Tasks { get; set; } = new List<ModuleTaskDto>();
}

public class CreateModulesDto
{
    public string ModuleNo { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public int TheoryHours { get; set; } = 0;
    public int PracticalHours { get; set; } = 0;
    public int NCSId { get; set; }
}

public class UpdateModulesDto
{
    public string? ModuleNo { get; set; }
    public string? ModuleName { get; set; }
    public int? TheoryHours { get; set; }
    public int? PracticalHours { get; set; }
    public int? NCSId { get; set; }
}
