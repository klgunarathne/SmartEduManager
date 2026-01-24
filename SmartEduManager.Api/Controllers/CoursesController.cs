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
public class CoursesController : ControllerBase
{
    private readonly ICourseRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<CoursesController> _logger;

    public CoursesController(ICourseRepository repository, IMapper mapper, ILogger<CoursesController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetCourses()
    {
        try
        {
            var courses = await _repository.GetCoursesWithCenterAsync();
            var coursesDto = _mapper.Map<IEnumerable<CourseDto>>(courses);

            _logger.LogInformation($"Retrieved {courses.Count()} courses");
            return Ok(coursesDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving courses");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCourse(int id)
    {
        try
        {
            var course = await _repository.GetByIdAsync(id);

            if (course == null)
            {
                _logger.LogWarning($"Course with id {id} not found");
                return NotFound("Course not found");
            }

            var courseDto = _mapper.Map<CourseDto>(course);
            return Ok(courseDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving course with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseDto createCourseDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var course = _mapper.Map<Course>(createCourseDto);
            await _repository.AddAsync(course);
            await _repository.SaveChangesAsync();

            var courseDto = _mapper.Map<CourseDto>(course);

            _logger.LogInformation($"Created course with id {course.CourseId}");
            return CreatedAtAction(nameof(GetCourse), new { id = course.CourseId }, courseDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating course");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCourse(int id, [FromBody] UpdateCourseDto updateCourseDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var course = await _repository.GetByIdAsync(id);
            if (course == null)
            {
                _logger.LogWarning($"Course with id {id} not found");
                return NotFound("Course not found");
            }

            _mapper.Map(updateCourseDto, course);
            _repository.Update(course);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated course with id {id}");
            return Ok("Course updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating course with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCourse(int id)
    {
        try
        {
            var course = await _repository.GetByIdAsync(id);
            if (course == null)
            {
                _logger.LogWarning($"Course with id {id} not found");
                return NotFound("Course not found");
            }

            _repository.Delete(course);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted course with id {id}");
            return Ok("Course deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting course with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}
