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
public class CentersController : ControllerBase
{
    private readonly ICenterRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<CentersController> _logger;

    public CentersController(ICenterRepository repository, IMapper mapper, ILogger<CentersController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetCenters()
    {
        try
        {
            var centers = await _repository.GetCentersWithDistrictAsync();
            var centersDto = _mapper.Map<IEnumerable<CenterDto>>(centers);

            _logger.LogInformation($"Retrieved {centers.Count()} centers");
            return Ok(centersDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving centers");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCenter(int id)
    {
        try
        {
            var center = await _repository.GetByIdAsync(id);

            if (center == null)
            {
                _logger.LogWarning($"Center with id {id} not found");
                return NotFound("Center not found");
            }

            var centerDto = _mapper.Map<CenterDto>(center);
            return Ok(centerDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving center with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCenter([FromBody] CreateCenterDto createCenterDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var center = _mapper.Map<Center>(createCenterDto);
            await _repository.AddAsync(center);
            await _repository.SaveChangesAsync();

            var centerDto = _mapper.Map<CenterDto>(center);

            _logger.LogInformation($"Created center with id {center.CenterId}");
            return CreatedAtAction(nameof(GetCenter), new { id = center.CenterId }, centerDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating center");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCenter(int id, [FromBody] UpdateCenterDto updateCenterDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var center = await _repository.GetByIdAsync(id);
            if (center == null)
            {
                _logger.LogWarning($"Center with id {id} not found");
                return NotFound("Center not found");
            }

            _mapper.Map(updateCenterDto, center);
            _repository.Update(center);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated center with id {id}");
            return Ok("Center updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating center with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCenter(int id)
    {
        try
        {
            var center = await _repository.GetByIdAsync(id);
            if (center == null)
            {
                _logger.LogWarning($"Center with id {id} not found");
                return NotFound("Center not found");
            }

            _repository.Delete(center);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted center with id {id}");
            return Ok("Center deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting center with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}
