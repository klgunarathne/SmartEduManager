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
public class InstructorsController : ControllerBase
{
    private readonly IInstructorRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<InstructorsController> _logger;

    public InstructorsController(IInstructorRepository repository, IMapper mapper, ILogger<InstructorsController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetInstructors()
    {
        try
        {
            var instructors = await _repository.GetAllAsync();
            var instructorsDto = _mapper.Map<IEnumerable<InstructorDto>>(instructors);

            _logger.LogInformation($"Retrieved {instructors.Count()} instructors");
            return Ok(instructorsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving instructors");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetInstructor(int id)
    {
        try
        {
            var instructor = await _repository.GetByIdAsync(id);

            if (instructor == null)
            {
                _logger.LogWarning($"Instructor with id {id} not found");
                return NotFound("Instructor not found");
            }

            var instructorDto = _mapper.Map<InstructorDto>(instructor);
            return Ok(instructorDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving instructor with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateInstructor([FromBody] CreateInstructorDto createInstructorDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var instructor = _mapper.Map<Instructor>(createInstructorDto);
            await _repository.AddAsync(instructor);
            await _repository.SaveChangesAsync();

            var instructorDto = _mapper.Map<InstructorDto>(instructor);

            _logger.LogInformation($"Created instructor with id {instructor.InstructorId}");
            return CreatedAtAction(nameof(GetInstructor), new { id = instructor.InstructorId }, instructorDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating instructor");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateInstructor(int id, [FromBody] UpdateInstructorDto updateInstructorDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var instructor = await _repository.GetByIdAsync(id);
            if (instructor == null)
            {
                _logger.LogWarning($"Instructor with id {id} not found");
                return NotFound("Instructor not found");
            }

            _mapper.Map(updateInstructorDto, instructor);
            _repository.Update(instructor);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated instructor with id {id}");
            return Ok("Instructor updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating instructor with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteInstructor(int id)
    {
        try
        {
            var instructor = await _repository.GetByIdAsync(id);
            if (instructor == null)
            {
                _logger.LogWarning($"Instructor with id {id} not found");
                return NotFound("Instructor not found");
            }

            _repository.Delete(instructor);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted instructor with id {id}");
            return Ok("Instructor deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting instructor with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}
