namespace SmartEduManager.Api.DTOs;

public class DistrictDto
{
    public int DistrictId { get; set; }
    public string DistrictName { get; set; } = null!;
}

public class CreateDistrictDto
{
    public string DistrictName { get; set; } = null!;
}

public class UpdateDistrictDto
{
    public string? DistrictName { get; set; }
}
