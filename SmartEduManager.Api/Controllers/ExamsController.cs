using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Services;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Instructor")]
public class ExamsController : ControllerBase
{
    private readonly IExamService _examService;
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ExamsController> _logger;

    public ExamsController(
        IExamService examService,
        AppDbContext context,
        IMapper mapper,
        ILogger<ExamsController> logger)
    {
        _examService = examService;
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var exams = await _examService.GetAllExamsAsync();
            return Ok(exams);
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
            var exam = await _context.Exams
                .Include(e => e.Category)
                .Include(e => e.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (exam == null)
            {
                return NotFound("Exam not found");
            }

            var examDto = _mapper.Map<ExamDto>(exam);
            return Ok(examDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving questions for exam {ExamId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("student")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStudentExams()
    {
        try
        {
            var exams = await _examService.GetStudentExamsAsync();
            return Ok(exams);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving student exams");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExamDto createDto)
    {
        try
        {
            var exam = await _examService.CreateExamAsync(createDto);
            _logger.LogInformation("Created exam with id {ExamId}", exam.Id);
            return CreatedAtAction(nameof(Get), new { id = exam.Id }, exam);
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
            var exam = await _examService.GetExamWithQuestionsAsync(id);
            if (exam == null)
            {
                _logger.LogWarning("Exam with id {ExamId} not found", id);
                return NotFound("Exam not found");
            }

            return Ok(exam);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving exam with id {ExamId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{examId}/questions")]
    public async Task<IActionResult> AddQuestionToExam(int examId, [FromBody] AddQuestionToExamDto dto)
    {
        try
        {
            var success = await _examService.AddQuestionToExamAsync(examId, dto.QuestionId);
            
            if (!success)
            {
                return NotFound("Exam or question not found");
            }

            var savedExamQuestion = await _context.ExamQuestions
                .Include(eq => eq.Question)
                    .ThenInclude(q => q.Category)
                .LastOrDefaultAsync(eq => eq.ExamId == examId && eq.QuestionId == dto.QuestionId);

            if (savedExamQuestion == null)
            {
                return NotFound("Question not found in exam");
            }

            var examQuestionDto = _mapper.Map<ExamQuestionDto>(savedExamQuestion);
            return Ok(examQuestionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding question to exam {ExamId}", examId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{examId}/questions/{questionId}")]
    public async Task<IActionResult> RemoveQuestionFromExam(int examId, int questionId)
    {
        try
        {
            var success = await _examService.RemoveQuestionFromExamAsync(examId, questionId);
            
            if (!success)
            {
                return NotFound("Question not found in exam");
            }

            return Ok("Question removed from exam successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing question {QuestionId} from exam {ExamId}", questionId, examId);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPatch("{id}/schedule")]
    public async Task<IActionResult> ScheduleExam(int id, [FromBody] ScheduleExamDto dto)
    {
        try
        {
            var success = await _examService.ScheduleExamAsync(id, dto);
            
            if (!success)
            {
                return NotFound("Exam not found");
            }
            
            return Ok("Exam scheduled successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scheduling exam {ExamId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateExamDto updateDto)
    {
        try
        {
            var success = await _examService.UpdateExamAsync(id, updateDto);
            
            if (!success)
            {
                return NotFound("Exam not found");
            }

            return Ok("Exam updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating exam {ExamId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var success = await _examService.DeleteExamAsync(id);
            
            if (!success)
            {
                return NotFound("Exam not found");
            }

            return Ok("Exam deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting exam {ExamId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPatch("{id}/publish")]
    public async Task<IActionResult> PublishExam(int id)
    {
        try
        {
            var success = await _examService.PublishExamAsync(id);
            
            if (!success)
            {
                return NotFound("Exam not found");
            }

            return Ok("Exam published successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing exam {ExamId}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}