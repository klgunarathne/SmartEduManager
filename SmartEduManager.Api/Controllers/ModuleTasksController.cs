using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Instructor")]
public class ModuleTasksController : ControllerBase
{
    private readonly IModuleTaskRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<ModuleTasksController> _logger;
    private readonly AppDbContext _context;

    public ModuleTasksController(IModuleTaskRepository repository, IMapper mapper, ILogger<ModuleTasksController> logger, AppDbContext context)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetModuleTasks()
    {
        try
        {
            var tasksList = await _repository.GetAllAsync();
            var tasksDto = _mapper.Map<IEnumerable<ModuleTaskDto>>(tasksList);

            _logger.LogInformation($"Retrieved {tasksList.Count()} module tasks");
            return Ok(tasksDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving module tasks");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetModuleTask(int id)
    {
        try
        {
            var task = await _repository.GetByIdAsync(id);

            if (task == null)
            {
                _logger.LogWarning($"Module task with id {id} not found");
                return NotFound("Module task not found");
            }

            var taskDto = _mapper.Map<ModuleTaskDto>(task);
            return Ok(taskDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving module task with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("module/{moduleId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetModuleTasksByModuleId(int moduleId)
    {
        try
        {
            var tasksList = await _repository.GetModuleTasksByModuleIdAsync(moduleId);
            var tasksDto = _mapper.Map<IEnumerable<ModuleTaskDto>>(tasksList);

            _logger.LogInformation($"Retrieved {tasksList.Count()} module tasks for module id {moduleId}");
            return Ok(tasksDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving module tasks for module id {moduleId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateModuleTask([FromBody] CreateModuleTaskDto createModuleTaskDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var task = _mapper.Map<ModuleTask>(createModuleTaskDto);
            await _repository.AddAsync(task);
            await _repository.SaveChangesAsync();

            var taskDto = _mapper.Map<ModuleTaskDto>(task);

            _logger.LogInformation($"Created module task with id {task.Id}");
            return CreatedAtAction(nameof(GetModuleTask), new { id = task.Id }, taskDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating module task");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateModuleTask(int id, [FromBody] UpdateModuleTaskDto updateModuleTaskDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var task = await _repository.GetByIdAsync(id);
            if (task == null)
            {
                _logger.LogWarning($"Module task with id {id} not found");
                return NotFound("Module task not found");
            }

            _mapper.Map(updateModuleTaskDto, task);
            _repository.Update(task);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated module task with id {id}");
            return Ok("Module task updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating module task with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteModuleTask(int id)
    {
        try
        {
            var task = await _repository.GetByIdAsync(id);
            if (task == null)
            {
                _logger.LogWarning($"Module task with id {id} not found");
                return NotFound("Module task not found");
            }

            _repository.Delete(task);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted module task with id {id}");
            return Ok("Module task deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting module task with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}/original-date")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> SetOriginalAssessmentDate(int id, [FromBody] OriginalDateUpdateDto updateDto)
    {
        try
        {
            var task = await _context.ModuleTasks
                .Include(t => t.Module)
                .ThenInclude(m => m.NCS)
                .ThenInclude(n => n.Course)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
            {
                _logger.LogWarning($"Module task with id {id} not found");
                return NotFound("Module task not found");
            }

            task.OriginalAssessmentDate = updateDto.OriginalAssessmentDate;

            var courseId = task.Module.NCS.CourseId;

            var existingAssessments = await _context.ContinuousAssessments
                .Where(ca => ca.ModuleTaskId == id)
                .ToListAsync();

            // Get students from the course that own assessments for this task
            foreach (var assessment in existingAssessments)
            {
                if (assessment.CompetencyDate == null)
                {
                    assessment.CompetencyDate = updateDto.OriginalAssessmentDate;
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Set original assessment date for module task {id}");
            return Ok("Original assessment date updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error setting original assessment date for module task {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}
