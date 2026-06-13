using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;
using System.Text;
using System.Linq;
using System.Collections.Generic;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Instructor")]
public class StudentsController : ControllerBase
{
    private readonly IStudentRepository _studentRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IMapper _mapper;
    private readonly ILogger<StudentsController> _logger;
    private readonly AppDbContext _context;

    public StudentsController(
        IStudentRepository repository,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IMapper mapper,
        ILogger<StudentsController> logger,
        AppDbContext context)
    {
        _studentRepository = repository;
        _userManager = userManager;
        _roleManager = roleManager;
        _mapper = mapper;
        _logger = logger;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetStudents()
    {
        try
        {
            var students = await _studentRepository.GetStudentsWithBatchAndCourseAsync();
            var studentsDto = _mapper.Map<IEnumerable<StudentDto>>(students);

            _logger.LogInformation($"Retrieved {students.Count()} students");
            return Ok(studentsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving students");
            return StatusCode(500, "Internal server error");
        }
    }

[HttpGet("batch/{batchId}")]
    public async Task<IActionResult> GetStudentsByBatch(int batchId)
    {
        try
        {
            var students = await _studentRepository.GetStudentsWithBatchAndCourseAsync();
            var batchStudents = students.Where(s => s.BatchId == batchId).ToList();
            var studentsDto = _mapper.Map<IEnumerable<StudentDto>>(batchStudents);

            _logger.LogInformation($"Retrieved {batchStudents.Count()} students for batch {batchId}");
            return Ok(studentsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving students by batch");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetStudent(int id)
    {
        try
        {
            var student = await _studentRepository.GetStudentWithBatchAndCourseAsync(id);

            if (student == null)
            {
                _logger.LogWarning($"Student with id {id} not found");
                return NotFound("Student not found");
            }

            var studentDto = _mapper.Map<StudentDto>(student);
            return Ok(studentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving student with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateStudent([FromBody] CreateStudentDto createStudentDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var student = _mapper.Map<Student>(createStudentDto);
            await _studentRepository.AddAsync(student);
            await _studentRepository.SaveChangesAsync();

            var studentDto = _mapper.Map<StudentDto>(student);

            _logger.LogInformation($"Created student with id {student.StudentId}");
            return CreatedAtAction(nameof(GetStudent), new { id = student.StudentId }, studentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating student");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateStudent(int id, [FromBody] UpdateStudentDto updateStudentDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var student = await _studentRepository.GetStudentWithBatchAndCourseAsync(id);
            if (student == null)
            {
                _logger.LogWarning($"Student with id {id} not found");
                return NotFound("Student not found");
            }

            _mapper.Map(updateStudentDto, student);
            _studentRepository.Update(student);
            await _studentRepository.SaveChangesAsync();

            _logger.LogInformation($"Updated student with id {id}");
            return Ok("Student updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating student with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> DeleteStudent(int id)
    {
        try
        {
            var student = await _studentRepository.GetStudentWithBatchAndCourseAsync(id);
            if (student == null)
            {
                _logger.LogWarning($"Student with id {id} not found");
                return NotFound("Student not found");
            }

            await _studentRepository.DeleteStudentWithRelationsAsync(id);

            _logger.LogInformation($"Deleted student with id {id}");
            return Ok("Student deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting student with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("generate-credentials")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> GenerateCredentials([FromBody] GenerateCredentialsDto dto)
    {
        try
        {
            var students = dto.StudentIds != null && dto.StudentIds.Any()
                ? (await _studentRepository.GetStudentsWithBatchAndCourseAsync())
                    .Where(s => dto.StudentIds.Contains(s.StudentId)).ToList()
                : dto.BatchId.HasValue
                    ? (await _studentRepository.GetStudentsWithBatchAndCourseAsync())
                        .Where(s => s.BatchId == dto.BatchId.Value).ToList()
                    : (await _studentRepository.GetStudentsWithBatchAndCourseAsync()).ToList();

            if (!students.Any())
            {
                return NotFound("No students found for the specified criteria");
            }

            var results = new List<GeneratedCredentials>();

            foreach (var student in students)
            {
                var username = student.NICNo;
                var email = student.Email ?? $"{student.NICNo}@exam.com";
                var existingUser = await _userManager.FindByNameAsync(username);

                if (existingUser != null)
                {
                    results.Add(new GeneratedCredentials
                    {
                        StudentId = student.StudentId,
                        StudentName = student.FullName,
                        Username = username,
                        Password = "********",
                        Email = student.Email ?? string.Empty,
                        Status = "Exists"
                    });
                    continue;
                }

                var password = dto.GenerateRandomPassword
                    ? GenerateRandomPassword()
                    : (dto.DefaultPassword ?? GenerateRandomPassword());

                var user = new ApplicationUser
                {
                    UserName = username,
                    Email = email,
                    FirstName = student.NameWithInitials ?? student.FullName,
                    LastName = student.FullName,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, password);
                if (result.Succeeded)
                {
                    if (!await _roleManager.RoleExistsAsync("Student"))
                        await _roleManager.CreateAsync(new IdentityRole("Student"));

                    await _userManager.AddToRoleAsync(user, "Student");

                    results.Add(new GeneratedCredentials
                    {
                        StudentId = student.StudentId,
                        StudentName = student.FullName,
                        Username = username,
                        Password = password,
                        Email = email,
                        Status = "Created"
                    });
                }
                else
                {
                    results.Add(new GeneratedCredentials
                    {
                        StudentId = student.StudentId,
                        StudentName = student.FullName,
                        Username = username,
                        Password = "",
                        Email = email,
                        Status = "Error: " + string.Join(", ", result.Errors.Select(e => e.Description))
                    });
                }
            }

            _logger.LogInformation($"Generated credentials for {results.Count(r => r.Status == "Created")} students");
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating credentials");
            return StatusCode(500, "Internal server error");
        }
    }

    private string GenerateRandomPassword()
    {
        string upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        string lower = "abcdefghijklmnopqrstuvwxyz";
        string digits = "0123456789";
        
        var random = new Random();
        var passwordChars = new List<char>();
        
        passwordChars.Add(upper[random.Next(upper.Length)]);
        passwordChars.Add(lower[random.Next(lower.Length)]);
        passwordChars.Add(digits[random.Next(digits.Length)]);
        
        for (int i = 0; i < 9; i++)
        {
            string chars = upper + lower + digits;
            passwordChars.Add(chars[random.Next(chars.Length)]);
        }
        
        return new string(passwordChars.OrderBy(_ => random.Next()).ToArray());
    }
}
