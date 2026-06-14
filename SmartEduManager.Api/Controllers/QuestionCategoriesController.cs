using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Controllers;

[Route("api/question-categories")]
[ApiController]
[Authorize(Roles = "Admin,Instructor")]
public class QuestionCategoriesController : ControllerBase
{
    private readonly IQuestionCategoryRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<QuestionCategoriesController> _logger;

    public QuestionCategoriesController(
        IQuestionCategoryRepository repository,
        IMapper mapper,
        ILogger<QuestionCategoriesController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var categories = await _repository.GetAllAsync();
            var categoriesDto = _mapper.Map<IEnumerable<QuestionCategoryDto>>(categories);
            return Ok(categoriesDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all question categories");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        try
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null)
            {
                _logger.LogWarning($"Question category with id {id} not found");
                return NotFound("Category not found");
            }

            var categoryDto = _mapper.Map<QuestionCategoryDto>(category);
            return Ok(categoryDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving question category with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuestionCategoryDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var category = _mapper.Map<QuestionCategory>(createDto);
            await _repository.AddAsync(category);
            await _repository.SaveChangesAsync();

            var categoryDto = _mapper.Map<QuestionCategoryDto>(category);
            _logger.LogInformation($"Created question category with id {category.Id}");
            return CreatedAtAction(nameof(Get), new { id = category.Id }, categoryDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating question category");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateQuestionCategoryDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var category = await _repository.GetByIdAsync(id);
            if (category == null)
            {
                _logger.LogWarning($"Question category with id {id} not found");
                return NotFound("Category not found");
            }

            _mapper.Map(updateDto, category);
            _repository.Update(category);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated question category with id {id}");
            return Ok("Category updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating question category with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null)
            {
                _logger.LogWarning($"Question category with id {id} not found");
                return NotFound("Category not found");
            }

            _repository.Delete(category);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted question category with id {id}");
            return Ok("Category deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting question category with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}