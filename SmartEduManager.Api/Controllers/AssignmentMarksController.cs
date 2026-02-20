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
public class AssignmentMarksController : ControllerBase
{
    private readonly IAssignmentMarksRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<AssignmentMarksController> _logger;

    public AssignmentMarksController(
        IAssignmentMarksRepository repository,
        IMapper mapper,
        ILogger<AssignmentMarksController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAssignmentMarks()
    {
        try
        {
            var assignmentMarks = await _repository.GetAllAsync();
            var assignmentMarksDto = _mapper.Map<IEnumerable<AssignmentMarksDto>>(assignmentMarks);
            return Ok(assignmentMarksDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all assignment marks");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("assignment/{assignmentId}")]
    public async Task<IActionResult> GetAssignmentMarksByAssignment(int assignmentId)
    {
        try
        {
            var assignmentMarks = await _repository.GetAssignmentMarksByAssignmentAsync(assignmentId);
            var assignmentMarksDto = _mapper.Map<IEnumerable<AssignmentMarksDto>>(assignmentMarks);
            return Ok(assignmentMarksDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving assignment marks for assignment {assignmentId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetAssignmentMarksByStudent(int studentId)
    {
        try
        {
            var assignmentMarks = await _repository.GetAssignmentMarksByStudentAsync(studentId);
            var assignmentMarksDto = _mapper.Map<IEnumerable<AssignmentMarksDto>>(assignmentMarks);
            return Ok(assignmentMarksDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving assignment marks for student {studentId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAssignmentMarks(int id)
    {
        try
        {
            var assignmentMarks = await _repository.GetByIdAsync(id);
            if (assignmentMarks == null)
            {
                _logger.LogWarning($"Assignment marks with id {id} not found");
                return NotFound("Assignment marks not found");
            }

            var assignmentMarksDto = _mapper.Map<AssignmentMarksDto>(assignmentMarks);
            return Ok(assignmentMarksDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving assignment marks with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateAssignmentMarks([FromBody] CreateAssignmentMarksDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if assignment marks already exist
            var existingAssignmentMarks = await _repository.GetAssignmentMarksByAssignmentAndStudentAsync(
                createDto.AssignmentId, createDto.StudentId);
            if (existingAssignmentMarks != null)
            {
                return BadRequest("Assignment marks already exist for this assignment and student");
            }

            var assignmentMarks = _mapper.Map<AssignmentMarks>(createDto);
            await _repository.AddAsync(assignmentMarks);
            await _repository.SaveChangesAsync();

            var assignmentMarksDto = _mapper.Map<AssignmentMarksDto>(assignmentMarks);
            _logger.LogInformation($"Created assignment marks with id {assignmentMarks.Id}");
            return CreatedAtAction(nameof(GetAssignmentMarks), new { id = assignmentMarks.Id }, assignmentMarksDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating assignment marks");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAssignmentMarks(int id, [FromBody] UpdateAssignmentMarksDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var assignmentMarks = await _repository.GetByIdAsync(id);
            if (assignmentMarks == null)
            {
                _logger.LogWarning($"Assignment marks with id {id} not found");
                return NotFound("Assignment marks not found");
            }

            _mapper.Map(updateDto, assignmentMarks);
            _repository.Update(assignmentMarks);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated assignment marks with id {id}");
            return Ok("Assignment marks updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating assignment marks with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("assignment/{assignmentId}/student/{studentId}")]
    public async Task<IActionResult> UpdateAssignmentMarksByAssignmentAndStudent(int assignmentId, int studentId, [FromBody] UpdateAssignmentMarksDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var assignmentMarks = await _repository.GetAssignmentMarksByAssignmentAndStudentAsync(assignmentId, studentId);
            if (assignmentMarks == null)
            {
                // If assignment marks don't exist, create a new one
                var createDto = new CreateAssignmentMarksDto
                {
                    AssignmentId = assignmentId,
                    StudentId = studentId,
                    Marks = updateDto.Marks,
                    AssignmentDate = updateDto.AssignmentDate
                };

                var newAssignmentMarks = _mapper.Map<AssignmentMarks>(createDto);
                await _repository.AddAsync(newAssignmentMarks);
                await _repository.SaveChangesAsync();

                var assignmentMarksDto = _mapper.Map<AssignmentMarksDto>(newAssignmentMarks);
                _logger.LogInformation($"Created assignment marks for assignment {assignmentId} and student {studentId}");
                return CreatedAtAction(nameof(GetAssignmentMarks), new { id = newAssignmentMarks.Id }, assignmentMarksDto);
            }

            // Update existing assignment marks
            _mapper.Map(updateDto, assignmentMarks);
            _repository.Update(assignmentMarks);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated assignment marks for assignment {assignmentId} and student {studentId}");
            return Ok("Assignment marks updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating assignment marks for assignment {assignmentId} and student {studentId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAssignmentMarks(int id)
    {
        try
        {
            var assignmentMarks = await _repository.GetByIdAsync(id);
            if (assignmentMarks == null)
            {
                _logger.LogWarning($"Assignment marks with id {id} not found");
                return NotFound("Assignment marks not found");
            }

            _repository.Delete(assignmentMarks);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted assignment marks with id {id}");
            return Ok("Assignment marks deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting assignment marks with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}
