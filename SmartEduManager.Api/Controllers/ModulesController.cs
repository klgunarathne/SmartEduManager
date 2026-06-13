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
public class ModulesController : ControllerBase
{
    private readonly IModulesRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<ModulesController> _logger;

    public ModulesController(IModulesRepository repository, IMapper mapper, ILogger<ModulesController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetModules()
    {
        try
        {
            var modulesList = await _repository.GetModulesWithTasksAsync();
            var modulesDto = _mapper.Map<IEnumerable<ModulesDto>>(modulesList);

            _logger.LogInformation($"Retrieved {modulesList.Count()} modules");
            return Ok(modulesDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving modules");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetModule(int id)
    {
        try
        {
            var module = await _repository.GetByIdAsync(id);

            if (module == null)
            {
                _logger.LogWarning($"Module with id {id} not found");
                return NotFound("Module not found");
            }

            var moduleDto = _mapper.Map<ModulesDto>(module);
            return Ok(moduleDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving module with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("ncs/{ncsId}")]
    public async Task<IActionResult> GetModulesByNCSId(int ncsId)
    {
        try
        {
            var modulesList = await _repository.GetModulesByNCSIdAsync(ncsId);
            var modulesDto = _mapper.Map<IEnumerable<ModulesDto>>(modulesList);

            _logger.LogInformation($"Retrieved {modulesList.Count()} modules for NCS id {ncsId}");
            return Ok(modulesDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving modules for NCS id {ncsId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> CreateModule([FromBody] CreateModulesDto createModuleDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var module = _mapper.Map<Models.Modules>(createModuleDto);
            await _repository.AddAsync(module);
            await _repository.SaveChangesAsync();

            var moduleDto = _mapper.Map<ModulesDto>(module);

            _logger.LogInformation($"Created module with id {module.Id}");
            return CreatedAtAction(nameof(GetModule), new { id = module.Id }, moduleDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating module");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UpdateModule(int id, [FromBody] UpdateModulesDto updateModuleDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var module = await _repository.GetByIdAsync(id);
            if (module == null)
            {
                _logger.LogWarning($"Module with id {id} not found");
                return NotFound("Module not found");
            }

            _mapper.Map(updateModuleDto, module);
            _repository.Update(module);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated module with id {id}");
            return Ok("Module updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating module with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteModule(int id)
    {
        try
        {
            var module = await _repository.GetByIdAsync(id);
            if (module == null)
            {
                _logger.LogWarning($"Module with id {id} not found");
                return NotFound("Module not found");
            }

            _repository.Delete(module);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted module with id {id}");
            return Ok("Module deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting module with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}
