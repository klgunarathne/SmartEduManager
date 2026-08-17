using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Helpers;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;
using System.Security.Claims;

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
    private readonly ImageUploadHelper _imageUploadHelper;

    public QuestionsController(
        IQuestionRepository repository,
        AppDbContext context,
        IMapper mapper,
        ILogger<QuestionsController> logger,
        ImageUploadHelper imageUploadHelper)
    {
        _repository = repository;
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _imageUploadHelper = imageUploadHelper;
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
            question.ImageUrl = createDto.ImageUrl;
            await _repository.AddAsync(question);
            await _repository.SaveChangesAsync();

            var questionDto = _mapper.Map<QuestionDto>(question);
            _logger.LogInformation("Created question with id {QuestionId} ImageUrl={ImageUrl}", question.Id, question.ImageUrl);
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
            question.ImageUrl = updateDto.ImageUrl;
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

    [HttpPost("upload-image/{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UploadImage(int id, IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            var question = await _context.Questions.FirstOrDefaultAsync(q => q.Id == id);
            if (question == null)
            {
                return NotFound("Question not found");
            }

            if (!string.IsNullOrEmpty(question.ImageUrl))
            {
                _imageUploadHelper.DeleteImage(question.ImageUrl);
            }

            var imagePath = await _imageUploadHelper.UploadImageAsync(file, "questions");
            question.ImageUrl = imagePath;
            question.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated question {QuestionId} ImageUrl to {ImagePath}", id, imagePath);

            var reloaded = await _context.Questions.FirstOrDefaultAsync(q => q.Id == id);
            var questionDto = _mapper.Map<QuestionDto>(reloaded ?? question);
            return Ok(questionDto);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid image upload for question {QuestionId}", id);
            return BadRequest("Invalid image upload request");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image for question {QuestionId}", id);
            return StatusCode(500, "Error uploading image");
        }
    }

    [HttpDelete("{id}/image")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> DeleteImage(int id)
    {
        try
        {
            var question = await _repository.GetByIdAsync(id);
            if (question == null)
            {
                return NotFound("Question not found");
            }

            if (!string.IsNullOrEmpty(question.ImageUrl))
            {
                _imageUploadHelper.DeleteImage(question.ImageUrl);
                question.ImageUrl = null;
                question.UpdatedAt = DateTime.UtcNow;
                _repository.Update(question);
                await _repository.SaveChangesAsync();
            }

            var reloaded = await _repository.GetByIdAsync(id);
            var questionDto = _mapper.Map<QuestionDto>(reloaded ?? question);
            return Ok(questionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image for question {QuestionId}", id);
            return StatusCode(500, "Error deleting image");
        }
    }
}