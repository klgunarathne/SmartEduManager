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
public class CourseInstructorsController : ControllerBase
{
    private readonly ICourseInstructorRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<CourseInstructorsController> _logger;

    public CourseInstructorsController(ICourseInstructorRepository repository, IMapper mapper, ILogger<CourseInstructorsController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetCourseInstructors()
    {
        try
        {
            var courseInstructors = await _repository.GetCourseInstructorsWithDetailsAsync();
            var courseInstructorsDto = _mapper.Map<IEnumerable<CourseInstructorDto>>(courseInstructors);

            _logger.LogInformation($"Retrieved {courseInstructors.Count()} course-instructor relationships");
            return Ok(courseInstructorsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving course-instructor relationships");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{courseId}/{instructorId}")]
    public async Task<IActionResult> GetCourseInstructor(int courseId, int instructorId)
    {
        try
        {
            var courseInstructor = await _repository.GetByConditionAsync(ci => ci.CourseId == courseId && ci.InstructorId == instructorId);

            if (courseInstructor == null)
            {
                _logger.LogWarning($"Course-instructor relationship with course id {courseId} and instructor id {instructorId} not found");
                return NotFound("Course-instructor relationship not found");
            }

            var courseInstructorDto = _mapper.Map<CourseInstructorDto>(courseInstructor);
            return Ok(courseInstructorDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving course-instructor relationship with course id {courseId} and instructor id {instructorId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCourseInstructor([FromBody] CreateCourseInstructorDto createCourseInstructorDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if the relationship already exists
            var existingRelationship = await _repository.GetByConditionAsync(
                ci => ci.CourseId == createCourseInstructorDto.CourseId && 
                ci.InstructorId == createCourseInstructorDto.InstructorId);

            if (existingRelationship != null)
            {
                _logger.LogWarning($"Course-instructor relationship already exists for course id {createCourseInstructorDto.CourseId} and instructor id {createCourseInstructorDto.InstructorId}");
                return BadRequest("Course-instructor relationship already exists");
            }

            var courseInstructor = _mapper.Map<CourseInstructor>(createCourseInstructorDto);
            await _repository.AddAsync(courseInstructor);
            await _repository.SaveChangesAsync();

            var courseInstructorDto = _mapper.Map<CourseInstructorDto>(courseInstructor);

            _logger.LogInformation($"Created course-instructor relationship with course id {courseInstructor.CourseId} and instructor id {courseInstructor.InstructorId}");
            return CreatedAtAction(nameof(GetCourseInstructor), 
                new { courseId = courseInstructor.CourseId, instructorId = courseInstructor.InstructorId }, 
                courseInstructorDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating course-instructor relationship");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{courseId}/{instructorId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCourseInstructor(int courseId, int instructorId)
    {
        try
        {
            var courseInstructor = await _repository.GetByConditionAsync(
                ci => ci.CourseId == courseId && ci.InstructorId == instructorId);

            if (courseInstructor == null)
            {
                _logger.LogWarning($"Course-instructor relationship with course id {courseId} and instructor id {instructorId} not found");
                return NotFound("Course-instructor relationship not found");
            }

            _repository.Delete(courseInstructor);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted course-instructor relationship with course id {courseId} and instructor id {instructorId}");
            return Ok("Course-instructor relationship deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting course-instructor relationship with course id {courseId} and instructor id {instructorId}");
            return StatusCode(500, "Internal server error");
        }
    }
}
