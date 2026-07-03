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
    private readonly ICourseInstructorRepository _courseInstructorRepository;
    private readonly INCSRepository _ncsRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<CoursesController> _logger;

    public CoursesController(ICourseRepository repository, ICourseInstructorRepository courseInstructorRepository, INCSRepository ncsRepository, IMapper mapper, ILogger<CoursesController> logger)
    {
        _repository = repository;
        _courseInstructorRepository = courseInstructorRepository;
        _ncsRepository = ncsRepository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetCourses()
    {
        try
        {
            var courses = await _repository.GetCoursesWithAllDetailsAsync();
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
    public async Task<IActionResult> GetCourse(int id)
    {
        try
        {
            var course = await _repository.GetCourseWithAllDetailsAsync(id);

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

            if (createCourseDto.InstructorIds != null && createCourseDto.InstructorIds.Any())
            {
                foreach (var instructorId in createCourseDto.InstructorIds)
                {
                    await _courseInstructorRepository.AddAsync(new CourseInstructor { CourseId = course.CourseId, InstructorId = instructorId });
                }
                await _courseInstructorRepository.SaveChangesAsync();
            }

            var savedCourse = await _repository.GetCourseWithAllDetailsAsync(course.CourseId);
            var courseDto = _mapper.Map<CourseDto>(savedCourse);

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

            var course = await _repository.GetCourseWithAllDetailsAsync(id);
            if (course == null)
            {
                _logger.LogWarning($"Course with id {id} not found");
                return NotFound("Course not found");
            }

            _mapper.Map(updateCourseDto, course);
            _repository.Update(course);
            await _repository.SaveChangesAsync();

            if (updateCourseDto.InstructorIds != null)
            {
                var existingInstructors = course.CourseInstructors.Select(ci => ci.InstructorId).ToList();
                var toAdd = updateCourseDto.InstructorIds.Except(existingInstructors).ToList();
                var toRemove = existingInstructors.Except(updateCourseDto.InstructorIds).ToList();

                foreach (var instructorId in toRemove)
                {
                    var courseInstructor = course.CourseInstructors.FirstOrDefault(ci => ci.InstructorId == instructorId);
                    if (courseInstructor != null)
                    {
                        _courseInstructorRepository.Delete(courseInstructor);
                    }
                }

                foreach (var instructorId in toAdd)
                {
                    await _courseInstructorRepository.AddAsync(new CourseInstructor { CourseId = id, InstructorId = instructorId });
                }

                await _courseInstructorRepository.SaveChangesAsync();
            }

            if (updateCourseDto.NCSIds != null)
            {
                var existingNCS = course.NCS.Select(n => n.Id).ToList();
                var toAssign = updateCourseDto.NCSIds.Except(existingNCS).ToList();

                foreach (var ncsId in toAssign)
                {
                    var ncs = await _ncsRepository.GetByIdAsync(ncsId);
                    if (ncs != null)
                    {
                        ncs.CourseId = id;
                        _ncsRepository.Update(ncs);
                    }
                }
                await _ncsRepository.SaveChangesAsync();
            }

            var updatedCourse = await _repository.GetCourseWithAllDetailsAsync(id);
            var courseDto = _mapper.Map<CourseDto>(updatedCourse);
            _logger.LogInformation($"Updated course with id {id}");
            return Ok(courseDto);
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
