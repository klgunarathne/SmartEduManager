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
public class DistrictsController : ControllerBase
{
    private readonly IDistrictRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<DistrictsController> _logger;

    public DistrictsController(IDistrictRepository repository, IMapper mapper, ILogger<DistrictsController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetDistricts()
    {
        try
        {
            var districts = await _repository.GetAllAsync();
            var districtsDto = _mapper.Map<IEnumerable<DistrictDto>>(districts);

            _logger.LogInformation($"Retrieved {districts.Count()} districts");
            return Ok(districtsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving districts");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDistrict(int id)
    {
        try
        {
            var district = await _repository.GetByIdAsync(id);

            if (district == null)
            {
                _logger.LogWarning($"District with id {id} not found");
                return NotFound("District not found");
            }

            var districtDto = _mapper.Map<DistrictDto>(district);
            return Ok(districtDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving district with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateDistrict([FromBody] CreateDistrictDto createDistrictDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var district = _mapper.Map<District>(createDistrictDto);
            await _repository.AddAsync(district);
            await _repository.SaveChangesAsync();

            var districtDto = _mapper.Map<DistrictDto>(district);

            _logger.LogInformation($"Created district with id {district.DistrictId}");
            return CreatedAtAction(nameof(GetDistrict), new { id = district.DistrictId }, districtDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating district");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateDistrict(int id, [FromBody] UpdateDistrictDto updateDistrictDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var district = await _repository.GetByIdAsync(id);
            if (district == null)
            {
                _logger.LogWarning($"District with id {id} not found");
                return NotFound("District not found");
            }

            _mapper.Map(updateDistrictDto, district);
            _repository.Update(district);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated district with id {id}");
            return Ok("District updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating district with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteDistrict(int id)
    {
        try
        {
            var district = await _repository.GetByIdAsync(id);
            if (district == null)
            {
                _logger.LogWarning($"District with id {id} not found");
                return NotFound("District not found");
            }

            _repository.Delete(district);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted district with id {id}");
            return Ok("District deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting district with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}
