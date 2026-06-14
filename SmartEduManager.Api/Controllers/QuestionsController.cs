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
public class QuestionsController : ControllerBase
{
    private readonly IQuestionRepository _repository;
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<QuestionsController> _logger;

    public QuestionsController(
        IQuestionRepository repository,
        AppDbContext context,
        IMapper mapper,
        ILogger<QuestionsController> logger)
    {
        _repository = repository;
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var questions = await _context.Questions
                .Include(q => q.Category)
                .ToListAsync();
            var questionsDto = _mapper.Map<IEnumerable<QuestionDto>>(questions);
            return Ok(questionsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all questions");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        try
        {
            var question = await _context.Questions
                .Include(q => q.Category)
                .FirstOrDefaultAsync(q => q.Id == id);
            if (question == null)
            {
                _logger.LogWarning($"Question with id {id} not found");
                return NotFound("Question not found");
            }

            var questionDto = _mapper.Map<QuestionDto>(question);
            return Ok(questionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving question with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuestionDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var question = _mapper.Map<Question>(createDto);
            question.Tags = createDto.Tags ?? [];
            await _repository.AddAsync(question);
            await _repository.SaveChangesAsync();

            var questionDto = _mapper.Map<QuestionDto>(question);
            _logger.LogInformation($"Created question with id {question.Id}");
            return CreatedAtAction(nameof(Get), new { id = question.Id }, questionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating question");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateQuestionDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var question = await _repository.GetByIdAsync(id);
            if (question == null)
            {
                _logger.LogWarning($"Question with id {id} not found");
                return NotFound("Question not found");
            }

            _mapper.Map(updateDto, question);
            question.Tags = updateDto.Tags ?? [];
            question.UpdatedAt = DateTime.UtcNow;
            _repository.Update(question);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Updated question with id {id}");
            return Ok("Question updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating question with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var question = await _repository.GetByIdAsync(id);
            if (question == null)
            {
                _logger.LogWarning($"Question with id {id} not found");
                return NotFound("Question not found");
            }

            _repository.Delete(question);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted question with id {id}");
            return Ok("Question deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting question with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}