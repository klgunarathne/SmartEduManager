namespace SmartEduManager.Api.Models;

public class District
{
    public int DistrictId { get; set; }
    public string DistrictName { get; set; } = null!;

    // Navigation property
    public ICollection<Center> Centers { get; set; } = new List<Center>();
}
