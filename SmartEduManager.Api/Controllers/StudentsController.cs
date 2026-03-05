using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Instructor")]
public class StudentsController : ControllerBase
{
    private readonly IStudentRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<StudentsController> _logger;

    public StudentsController(IStudentRepository repository, IMapper mapper, ILogger<StudentsController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetStudents()
    {
        try
        {
            var students = await _repository.GetStudentsWithBatchAndCourseAsync();
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
            var students = await _repository.GetStudentsWithBatchAndCourseAsync();
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
            var student = await _repository.GetByIdAsync(id);

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
            await _repository.AddAsync(student);
            await _repository.SaveChangesAsync();

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

            var student = await _repository.GetByIdAsync(id);
            if (student == null)
            {
                _logger.LogWarning($"Student with id {id} not found");
                return NotFound("Student not found");
            }

            _mapper.Map(updateStudentDto, student);
            _repository.Update(student);
            await _repository.SaveChangesAsync();

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
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteStudent(int id)
    {
        try
        {
            var student = await _repository.GetByIdAsync(id);
            if (student == null)
            {
                _logger.LogWarning($"Student with id {id} not found");
                return NotFound("Student not found");
            }

            _repository.Delete(student);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted student with id {id}");
            return Ok("Student deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting student with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}
