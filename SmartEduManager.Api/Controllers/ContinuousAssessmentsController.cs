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
public class ContinuousAssessmentsController : ControllerBase
{
    private readonly IContinuousAssessmentRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<ContinuousAssessmentsController> _logger;

    public ContinuousAssessmentsController(
        IContinuousAssessmentRepository repository,
        IMapper mapper,
        ILogger<ContinuousAssessmentsController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAssessments()
    {
        try
        {
            var assessments = await _repository.GetAllAsync();
            var assessmentsDto = _mapper.Map<IEnumerable<ContinuousAssessmentDto>>(assessments);
            return Ok(assessmentsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all continuous assessments");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetAssessmentsByStudent(int studentId)
    {
        try
        {
            var assessments = await _repository.GetAssessmentsByStudentAsync(studentId);
            var assessmentsDto = _mapper.Map<IEnumerable<ContinuousAssessmentDto>>(assessments);
            return Ok(assessmentsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving assessments for student {studentId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("moduletask/{moduleTaskId}")]
    public async Task<IActionResult> GetAssessmentsByModuleTask(int moduleTaskId)
    {
        try
        {
            var assessments = await _repository.GetAssessmentsByModuleTaskAsync(moduleTaskId);
            var assessmentsDto = _mapper.Map<IEnumerable<ContinuousAssessmentDto>>(assessments);
            return Ok(assessmentsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving assessments for module task {moduleTaskId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("batch/{batchId}")]
    public async Task<IActionResult> GetAssessmentsByBatch(int batchId)
    {
        try
        {
            var assessments = await _repository.GetAssessmentsByBatchAsync(batchId);
            var assessmentsDto = _mapper.Map<IEnumerable<ContinuousAssessmentDto>>(assessments);
            return Ok(assessmentsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving assessments for batch {batchId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("course/{courseId}")]
    public async Task<IActionResult> GetAssessmentsByCourse(int courseId)
    {
        try
        {
            var assessments = await _repository.GetAssessmentsByCourseAsync(courseId);
            var assessmentsDto = _mapper.Map<IEnumerable<ContinuousAssessmentDto>>(assessments);
            return Ok(assessmentsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving assessments for course {courseId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAssessment(int id)
    {
        try
        {
            var assessment = await _repository.GetByIdAsync(id);
            if (assessment == null)
            {
                _logger.LogWarning($"Continuous assessment with id {id} not found");
                return NotFound("Continuous assessment not found");
            }

            var assessmentDto = _mapper.Map<ContinuousAssessmentDto>(assessment);
            return Ok(assessmentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving continuous assessment with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateAssessment([FromBody] CreateContinuousAssessmentDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate assessment mark
            if (!IsValidAssessmentMark(createDto.AssessmentMark))
            {
                return BadRequest("Invalid assessment mark. Must be 'C' (Competent) or 'NYC' (Not Yet Competent)");
            }

            // Check if assessment already exists
            var existingAssessment = await _repository.GetAssessmentByStudentAndTaskAsync(
                createDto.StudentId, createDto.ModuleTaskId);
            if (existingAssessment != null)
            {
                return BadRequest("Assessment already exists for this student and task");
            }

            var assessment = _mapper.Map<ContinuousAssessment>(createDto);
            await _repository.AddAsync(assessment);
            await _repository.SaveChangesAsync();

            var assessmentDto = _mapper.Map<ContinuousAssessmentDto>(assessment);
            _logger.LogInformation($"Created continuous assessment with id {assessment.Id}");
            return CreatedAtAction(nameof(GetAssessment), new { id = assessment.Id }, assessmentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating continuous assessment");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAssessment(int id, [FromBody] UpdateContinuousAssessmentDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate assessment mark
            if (!IsValidAssessmentMark(updateDto.AssessmentMark))
            {
                return BadRequest("Invalid assessment mark. Must be 'C' (Competent) or 'NYC' (Not Yet Competent)");
            }

            var assessment = await _repository.GetByIdAsync(id);
            if (assessment == null)
            {
                _logger.LogWarning($"Continuous assessment with id {id} not found");
                return NotFound("Continuous assessment not found");
            }

            _mapper.Map(updateDto, assessment);
            _repository.Update(assessment);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated continuous assessment with id {id}");
            return Ok("Continuous assessment updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating continuous assessment with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAssessment(int id)
    {
        try
        {
            var assessment = await _repository.GetByIdAsync(id);
            if (assessment == null)
            {
                _logger.LogWarning($"Continuous assessment with id {id} not found");
                return NotFound("Continuous assessment not found");
            }

            _repository.Delete(assessment);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted continuous assessment with id {id}");
            return Ok("Continuous assessment deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting continuous assessment with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("student/{studentId}/task/{moduleTaskId}")]
    public async Task<IActionResult> UpdateAssessmentByStudentAndTask(int studentId, int moduleTaskId, [FromBody] UpdateContinuousAssessmentDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate assessment mark
            if (!IsValidAssessmentMark(updateDto.AssessmentMark))
            {
                return BadRequest("Invalid assessment mark. Must be 'C' (Competent) or 'NYC' (Not Yet Competent)");
            }

            var assessment = await _repository.GetAssessmentByStudentAndTaskAsync(studentId, moduleTaskId);
            if (assessment == null)
            {
                // If assessment doesn't exist, create a new one
                var createDto = new CreateContinuousAssessmentDto
                {
                    StudentId = studentId,
                    ModuleTaskId = moduleTaskId,
                    AssessmentMark = updateDto.AssessmentMark,
                    AssessmentDate = updateDto.AssessmentDate,
                    AssessorNotes = updateDto.AssessorNotes
                };

                var newAssessment = _mapper.Map<ContinuousAssessment>(createDto);
                await _repository.AddAsync(newAssessment);
                await _repository.SaveChangesAsync();

                var assessmentDto = _mapper.Map<ContinuousAssessmentDto>(newAssessment);
                _logger.LogInformation($"Created continuous assessment for student {studentId} and task {moduleTaskId}");
                return CreatedAtAction(nameof(GetAssessment), new { id = newAssessment.Id }, assessmentDto);
            }

            // Update existing assessment
            _mapper.Map(updateDto, assessment);
            _repository.Update(assessment);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated continuous assessment for student {studentId} and task {moduleTaskId}");
            return Ok("Continuous assessment updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating assessment for student {studentId} and task {moduleTaskId}");
            return StatusCode(500, "Internal server error");
        }
    }

    private bool IsValidAssessmentMark(string mark)
    {
        return !string.IsNullOrWhiteSpace(mark) && (mark.ToUpper() == "C" || mark.ToUpper() == "NYC");
    }
}
