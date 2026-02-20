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
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<AssignmentsController> _logger;

    public AssignmentsController(
        IAssignmentRepository repository,
        IMapper mapper,
        ILogger<AssignmentsController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAssignments()
    {
        try
        {
            var assignments = await _repository.GetAllAsync();
            var assignmentsDto = _mapper.Map<IEnumerable<AssignmentDto>>(assignments);
            return Ok(assignmentsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all assignments");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAssignment(int id)
    {
        try
        {
            var assignment = await _repository.GetByIdAsync(id);
            if (assignment == null)
            {
                _logger.LogWarning($"Assignment with id {id} not found");
                return NotFound("Assignment not found");
            }

            var assignmentDto = _mapper.Map<AssignmentDto>(assignment);
            return Ok(assignmentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving assignment with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var assignment = _mapper.Map<Assignment>(createDto);
            await _repository.AddAsync(assignment);
            await _repository.SaveChangesAsync();

            var assignmentDto = _mapper.Map<AssignmentDto>(assignment);
            _logger.LogInformation($"Created assignment with id {assignment.Id}");
            return CreatedAtAction(nameof(GetAssignment), new { id = assignment.Id }, assignmentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating assignment");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAssignment(int id, [FromBody] UpdateAssignmentDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var assignment = await _repository.GetByIdAsync(id);
            if (assignment == null)
            {
                _logger.LogWarning($"Assignment with id {id} not found");
                return NotFound("Assignment not found");
            }

            _mapper.Map(updateDto, assignment);
            _repository.Update(assignment);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated assignment with id {id}");
            return Ok("Assignment updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating assignment with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAssignment(int id)
    {
        try
        {
            var assignment = await _repository.GetByIdAsync(id);
            if (assignment == null)
            {
                _logger.LogWarning($"Assignment with id {id} not found");
                return NotFound("Assignment not found");
            }

            _repository.Delete(assignment);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted assignment with id {id}");
            return Ok("Assignment deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting assignment with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}
