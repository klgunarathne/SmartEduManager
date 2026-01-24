namespace SmartEduManager.Api.DTOs;

public class InstructorDto
{
    public int InstructorId { get; set; }
    public string EPFNo { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string NIC { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
}

public class CreateInstructorDto
{
    public string EPFNo { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string NIC { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
}

public class UpdateInstructorDto
{
    public string? EPFNo { get; set; }
    public string? FullName { get; set; }
    public string? NIC { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
}
