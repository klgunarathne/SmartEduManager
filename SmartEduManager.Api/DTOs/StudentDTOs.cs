namespace SmartEduManager.Api.DTOs;

public class StudentDto
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
    public string BatchCode { get; set; } = null!;
    public string GSDivision { get; set; } = null!;
    public string AGDivision { get; set; } = null!;
}

public class CreateStudentDto
{
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
}

public class UpdateStudentDto
{
    public string? MISNo { get; set; }
    public string? NameWithInitials { get; set; }
    public string? FullName { get; set; }
    public string? NICNo { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? Telephone { get; set; }
    public string? Email { get; set; }
    public int? BatchId { get; set; }
    public string? GSDivision { get; set; }
    public string? AGDivision { get; set; }
}
