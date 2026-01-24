namespace SmartEduManager.Api.DTOs;

public class CenterDto
{
    public int CenterId { get; set; }
    public string CenterName { get; set; } = null!;
    public int DistrictId { get; set; }
    public string DistrictName { get; set; } = null!;
}

public class CreateCenterDto
{
    public string CenterName { get; set; } = null!;
    public int DistrictId { get; set; }
}

public class UpdateCenterDto
{
    public string? CenterName { get; set; }
    public int? DistrictId { get; set; }
}
