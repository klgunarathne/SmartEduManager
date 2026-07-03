namespace SmartEduManager.Api.DTOs;

public class InstructorDto
{
    public int InstructorId { get; set; }
    public string EPFNo { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string NIC { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public List<int> CenterIds { get; set; } = new List<int>();
    public List<string> CenterNames { get; set; } = new List<string>();
    public List<int> CourseIds { get; set; } = new List<int>();
    public List<string> CourseNames { get; set; } = new List<string>();
}

public class CreateInstructorDto
{
    public string EPFNo { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string NIC { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public List<int> CenterIds { get; set; } = new List<int>();
    public List<int> CourseIds { get; set; } = new List<int>();
}

public class UpdateInstructorDto
{
    public string? EPFNo { get; set; }
    public string? FullName { get; set; }
    public string? NIC { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public List<int>? CenterIds { get; set; }
    public List<int>? CourseIds { get; set; }
}
