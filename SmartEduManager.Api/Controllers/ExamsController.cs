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
public class ExamsController : ControllerBase
{
    private readonly IExamRepository _repository;
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ExamsController> _logger;

    public ExamsController(
        IExamRepository repository,
        AppDbContext context,
        IMapper mapper,
        ILogger<ExamsController> logger)
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
            var exams = await _context.Exams
                .Include(e => e.Category)
                .Include(e => e.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
                .ToListAsync();
            
            var examsDto = exams.Select(e => new ExamDto
            {
                Id = e.Id,
                Title = e.Title,
                Description = e.Description,
                CategoryId = e.CategoryId,
                CategoryName = e.Category.Name,
                QuestionCount = e.ExamQuestions.Count,
                Duration = e.Duration,
                IsActive = e.Status == ExamStatus.Active,
                CreatedAt = e.CreatedAt.ToString("yyyy-MM-dd"),
                TotalMarks = e.ExamQuestions.Sum(eq => eq.Question.Marks)
            });
            
            return Ok(examsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all exams");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}/questions")]
    public async Task<IActionResult> GetExamQuestions(int id)
    {
        try
        {
            var examQuestions = await _context.ExamQuestions
                .Include(eq => eq.Question)
                .Where(eq => eq.ExamId == id)
                .OrderBy(eq => eq.Order)
                .ToListAsync();

            var examQuestionsDto = _mapper.Map<IEnumerable<ExamQuestionDto>>(examQuestions);
            return Ok(examQuestionsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving questions for exam {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExamDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var exam = _mapper.Map<Exam>(createDto);
            await _repository.AddAsync(exam);
            await _repository.SaveChangesAsync();

            var examDto = _mapper.Map<ExamDto>(exam);
            _logger.LogInformation($"Created exam with id {exam.Id}");
            return CreatedAtAction(nameof(Get), new { id = exam.Id }, examDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating exam");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        try
        {
            var exam = await _context.Exams
                .Include(e => e.Category)
                .Include(e => e.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
                .FirstOrDefaultAsync(e => e.Id == id);
            
            if (exam == null)
            {
                _logger.LogWarning($"Exam with id {id} not found");
                return NotFound("Exam not found");
            }

            var examDto = new ExamDto
            {
                Id = exam.Id,
                Title = exam.Title,
                Description = exam.Description,
                CategoryId = exam.CategoryId,
                CategoryName = exam.Category.Name,
                QuestionCount = exam.ExamQuestions.Count,
                Duration = exam.Duration,
                IsActive = exam.Status == ExamStatus.Active,
                CreatedAt = exam.CreatedAt.ToString("yyyy-MM-dd"),
                TotalMarks = exam.ExamQuestions.Sum(eq => eq.Question.Marks)
            };
            
            return Ok(examDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving exam with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{examId}/questions")]
    public async Task<IActionResult> AddQuestionToExam(int examId, [FromBody] AddQuestionToExamDto dto)
    {
        try
        {
            var exam = await _context.Exams.FindAsync(examId);
            if (exam == null)
            {
                return NotFound("Exam not found");
            }

            var question = await _context.Questions.FindAsync(dto.QuestionId);
            if (question == null)
            {
                return NotFound("Question not found");
            }

            var maxOrder = await _context.ExamQuestions
                .Where(eq => eq.ExamId == examId)
                .MaxAsync(eq => (int?)eq.Order) ?? 0;

            var examQuestion = new ExamQuestion
            {
                ExamId = examId,
                QuestionId = dto.QuestionId,
                Order = maxOrder + 1
            };

            _context.ExamQuestions.Add(examQuestion);
            await _context.SaveChangesAsync();

            var examQuestionDto = new ExamQuestionDto
            {
                Id = examQuestion.Id,
                ExamId = examQuestion.ExamId,
                QuestionId = examQuestion.QuestionId,
                Order = examQuestion.Order,
                Question = _mapper.Map<QuestionDto>(examQuestion.Question)
            };
            return Ok(examQuestionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error adding question to exam {examId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{examId}/questions/{questionId}")]
    public async Task<IActionResult> RemoveQuestionFromExam(int examId, int questionId)
    {
        try
        {
            var examQuestion = await _context.ExamQuestions
                .FirstOrDefaultAsync(eq => eq.ExamId == examId && eq.QuestionId == questionId);
            
            if (examQuestion == null)
            {
                return NotFound("Question not found in exam");
            }

            _context.ExamQuestions.Remove(examQuestion);
            await _context.SaveChangesAsync();

            return Ok("Question removed from exam successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error removing question {questionId} from exam {examId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPatch("{id}/schedule")]
    public async Task<IActionResult> ScheduleExam(int id, [FromBody] ScheduleExamDto dto)
    {
        try
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
            {
                return NotFound("Exam not found");
            }

            exam.AvailableFrom = dto.AvailableFrom;
            exam.AvailableTo = dto.AvailableTo;
            exam.TimeZone = dto.TimeZone;
            exam.Status = ExamStatus.Scheduled;

            await _context.SaveChangesAsync();
            return Ok("Exam scheduled successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error scheduling exam {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPatch("{id}/publish")]
    public async Task<IActionResult> PublishExam(int id)
    {
        try
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
            {
                return NotFound("Exam not found");
            }

            exam.Status = ExamStatus.Active;
            exam.PublishedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok("Exam published successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error publishing exam {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}