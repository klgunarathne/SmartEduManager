using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;
using System.Security.Claims;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Instructor")]
public class BatchesController : ControllerBase
{
    private readonly IBatchRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<BatchesController> _logger;
    private readonly AppDbContext _context;

    public BatchesController(IBatchRepository repository, IMapper mapper, ILogger<BatchesController> logger, AppDbContext context)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetBatches()
    {
        try
        {
            var isAdmin = User.IsInRole("Admin");
            IEnumerable<Batch> batches;

            if (isAdmin)
            {
                batches = await _repository.GetBatchesWithCourseAsync();
            }
            else
            {
                var userEmail = User.FindFirstValue(ClaimTypes.Email);
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized();
                }

                var instructor = await _context.Instructors
                    .FirstOrDefaultAsync(i => i.Email == userEmail);

                if (instructor == null)
                {
                    return NotFound("Instructor profile not found");
                }

                batches = await _repository.GetBatchesForInstructorAsync(instructor.InstructorId);
            }

            var batchesDto = _mapper.Map<IEnumerable<BatchDto>>(batches);
            _logger.LogInformation($"Retrieved {batchesDto.Count()} batches");
            return Ok(batchesDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving batches");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBatch(int id)
    {
        try
        {
            var batch = await _repository.GetByIdAsync(id);

            if (batch == null)
            {
                _logger.LogWarning($"Batch with id {id} not found");
                return NotFound("Batch not found");
            }

            var batchDto = _mapper.Map<BatchDto>(batch);
            return Ok(batchDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving batch with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> CreateBatch([FromBody] CreateBatchDto createBatchDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var batch = _mapper.Map<Batch>(createBatchDto);
            batch.Duration = (int)(batch.EndDate - batch.StartDate).TotalDays;
            await _repository.AddAsync(batch);
            await _repository.SaveChangesAsync();

            var batchDto = _mapper.Map<BatchDto>(batch);

            _logger.LogInformation($"Created batch with id {batch.BatchId}");
            return CreatedAtAction(nameof(GetBatch), new { id = batch.BatchId }, batchDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating batch");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UpdateBatch(int id, [FromBody] UpdateBatchDto updateBatchDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var batch = await _repository.GetByIdAsync(id);
            if (batch == null)
            {
                _logger.LogWarning($"Batch with id {id} not found");
                return NotFound("Batch not found");
            }

            _mapper.Map(updateBatchDto, batch);
            if (batch.StartDate != default && batch.EndDate != default)
            {
                batch.Duration = (int)(batch.EndDate - batch.StartDate).TotalDays;
            }
            _repository.Update(batch);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated batch with id {id}");
            return Ok("Batch updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating batch with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

[HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> DeleteBatch(int id)
    {
        try
        {
            var batch = await _repository.GetByIdAsync(id);
            if (batch == null)
            {
                _logger.LogWarning($"Batch with id {id} not found");
                return NotFound("Batch not found");
            }

            _repository.Delete(batch);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted batch with id {id}");
            return Ok("Batch deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting batch with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveBatches()
    {
        try
        {
            var batches = await _repository.GetBatchesWithCourseAsync();
            var batchesDto = _mapper.Map<IEnumerable<BatchDto>>(batches);

            var today = DateTime.Today;
            var activeBatches = batchesDto.Where(b => b.StartDate <= today && b.EndDate >= today);

            _logger.LogInformation($"Retrieved {activeBatches.Count()} active batches");
            return Ok(activeBatches);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active batches");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("instructor")]
    public async Task<IActionResult> GetBatchesForInstructor()
    {
        try
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized();
            }

            var instructor = await _context.Instructors
                .FirstOrDefaultAsync(i => i.Email == userEmail);

            if (instructor == null)
            {
                return NotFound("Instructor profile not found");
            }

            var batches = await _repository.GetBatchesForInstructorAsync(instructor.InstructorId);
            var batchesDto = _mapper.Map<IEnumerable<BatchDto>>(batches);

            _logger.LogInformation($"Retrieved {batchesDto.Count()} batches for instructor {instructor.InstructorId}");
            return Ok(batchesDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving instructor batches");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentBatchForInstructor()
    {
        try
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized();
            }

            var instructor = await _context.Instructors
                .FirstOrDefaultAsync(i => i.Email == userEmail);

            if (instructor == null)
            {
                return NotFound("Instructor profile not found");
            }

            var batch = await _repository.GetCurrentBatchForInstructorAsync(instructor.InstructorId);

            if (batch == null)
            {
                return NotFound("No active batch found for the current instructor");
            }

            var batchDto = _mapper.Map<BatchDto>(batch);
            _logger.LogInformation($"Retrieved current batch {batch.BatchId} for instructor {instructor.InstructorId}");
            return Ok(batchDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current batch for instructor");
            return StatusCode(500, "Internal server error");
        }
    }
}
