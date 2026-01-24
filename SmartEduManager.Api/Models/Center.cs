namespace SmartEduManager.Api.Models;

public class Center
{
    public int CenterId { get; set; }
    public string CenterName { get; set; } = null!;
    public int DistrictId { get; set; }

    // Navigation properties
    public District District { get; set; } = null!;
    public ICollection<Course> Courses { get; set; } = new List<Course>();
}
