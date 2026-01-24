namespace SmartEduManager.Api.Models;

public class Student
{
    public int StudentId { get; set; }
    public string MISNo { get; set; } = null!;
    public string NameWithInitials { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string NICNo { get; set; } = null!;
    public string Gender { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string Telephone { get; set; } = null!;
    public string Email { get; set; } = null!;
    public int BatchId { get; set; }
    public string GSDivision { get; set; } = null!;
    public string AGDivision { get; set; } = null!;

    // Navigation property
    public Batch Batch { get; set; } = null!;
}
