namespace SmartEduManager.Api.DTOs;

public class GeneratedCredentials
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Status { get; set; } = null!; // "Created", "Exists", "Skipped"
}

public class GenerateCredentialsDto
{
    public int? BatchId { get; set; }
    public List<int>? StudentIds { get; set; }
    public string? DefaultPassword { get; set; }
    public bool GenerateRandomPassword { get; set; } = true;
    public bool SendEmail { get; set; } = false;
    public string? UsernamePrefix { get; set; } // Optional prefix for username (e.g., "STU-")
}