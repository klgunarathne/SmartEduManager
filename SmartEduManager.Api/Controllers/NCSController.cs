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
public class NCSController : ControllerBase
{
    private readonly INCSRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<NCSController> _logger;

    public NCSController(INCSRepository repository, IMapper mapper, ILogger<NCSController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetNCS()
    {
        try
        {
            var ncsList = await _repository.GetNCSWithModulesAsync();
            var ncsDto = _mapper.Map<IEnumerable<NCSDto>>(ncsList);

            _logger.LogInformation($"Retrieved {ncsList.Count()} NCS records");
            return Ok(ncsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving NCS records");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNCS(int id)
    {
        try
        {
            var ncs = await _repository.GetByIdAsync(id);

            if (ncs == null)
            {
                _logger.LogWarning($"NCS record with id {id} not found");
                return NotFound("NCS record not found");
            }

            var ncsDto = _mapper.Map<NCSDto>(ncs);
            return Ok(ncsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving NCS record with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("course/{courseId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNCSByCourseId(int courseId)
    {
        try
        {
            var ncsList = await _repository.GetNCSByCourseIdAsync(courseId);
            var ncsDto = _mapper.Map<IEnumerable<NCSDto>>(ncsList);

            _logger.LogInformation($"Retrieved {ncsList.Count()} NCS records for course id {courseId}");
            return Ok(ncsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving NCS records for course id {courseId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateNCS([FromBody] CreateNCSDto createNCSDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var ncs = _mapper.Map<NCS>(createNCSDto);
            await _repository.AddAsync(ncs);
            await _repository.SaveChangesAsync();

            var ncsDto = _mapper.Map<NCSDto>(ncs);

            _logger.LogInformation($"Created NCS record with id {ncs.Id}");
            return CreatedAtAction(nameof(GetNCS), new { id = ncs.Id }, ncsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating NCS record");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateNCS(int id, [FromBody] UpdateNCSDto updateNCSDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var ncs = await _repository.GetByIdAsync(id);
            if (ncs == null)
            {
                _logger.LogWarning($"NCS record with id {id} not found");
                return NotFound("NCS record not found");
            }

            _mapper.Map(updateNCSDto, ncs);
            _repository.Update(ncs);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated NCS record with id {id}");
            return Ok("NCS record updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating NCS record with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteNCS(int id)
    {
        try
        {
            var ncs = await _repository.GetByIdAsync(id);
            if (ncs == null)
            {
                _logger.LogWarning($"NCS record with id {id} not found");
                return NotFound("NCS record not found");
            }

            _repository.Delete(ncs);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted NCS record with id {id}");
            return Ok("NCS record deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting NCS record with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}
