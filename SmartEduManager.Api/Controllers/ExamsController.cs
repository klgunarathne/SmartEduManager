using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Services;
using System.Security.Claims;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
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
    [Authorize(Roles = "Admin,Instructor")]
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
    [Authorize]
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
    [Authorize]
    public async Task<IActionResult> GetStudentExams()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var exams = await _examService.GetStudentExamsAsync(userId);
            return Ok(exams);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving student exams");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor")]
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
    [Authorize]
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
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> AddQuestionToExam(int examId, [FromBody] AddQuestionToExamDto dto)
    {
        var success = await _examService.AddQuestionToExamAsync(examId, dto.QuestionId);
        
        if (!success)
        {
            return NotFound("Exam or question not found");
        }

            var savedExamQuestion = await _context.ExamQuestions
                .Include(eq => eq.Question)
                    .ThenInclude(q => q.Category)
                .FirstOrDefaultAsync(eq => eq.ExamId == examId && eq.QuestionId == dto.QuestionId);

        if (savedExamQuestion == null)
        {
            return NotFound("Question not found in exam");
        }

        var examQuestionDto = _mapper.Map<ExamQuestionDto>(savedExamQuestion);
        return Ok(examQuestionDto);
    }

    [HttpDelete("{examId}/questions/{questionId}")]
    [Authorize(Roles = "Admin,Instructor")]
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
    [Authorize(Roles = "Admin,Instructor")]
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
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateExamDto updateDto)
    {
        try
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
            {
                return NotFound("Exam not found");
            }

            if (exam.Status == ExamStatus.Active || exam.Status == ExamStatus.Completed)
            {
                return BadRequest("Cannot update a published or completed exam");
            }

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
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool force = false)
    {
        try
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
            {
                return NotFound("Exam not found");
            }

            if (!force && (exam.Status == ExamStatus.Active || exam.Status == ExamStatus.Completed))
            {
                return BadRequest("Cannot delete a published or completed exam. Use force delete to override.");
            }

            if (force && (exam.Status == ExamStatus.Active || exam.Status == ExamStatus.Completed))
            {
                var attemptIds = await _context.ExamAttempts
                    .Where(a => a.ExamId == id)
                    .Select(a => a.Id)
                    .ToListAsync();

                if (attemptIds.Any())
                {
                    _context.ExamAnswers.RemoveRange(_context.ExamAnswers.Where(a => attemptIds.Contains(a.ExamAttemptId)));
                    await _context.SaveChangesAsync();

                    _context.ExamAttempts.RemoveRange(_context.ExamAttempts.Where(a => a.ExamId == id));
                    await _context.SaveChangesAsync();
                }
            }

            var success = await _examService.DeleteExamAsync(id);
            
            if (!success)
            {
                return NotFound("Exam not found");
            }

            return Ok(force && (exam.Status == ExamStatus.Active || exam.Status == ExamStatus.Completed) 
                ? "Published exam and related attempts deleted successfully" 
                : "Exam deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting exam {ExamId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPatch("{id}/questions/reorder")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> ReorderQuestions(int id, [FromBody] ReorderExamQuestionsDto dto)
    {
        try
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
            {
                return NotFound("Exam not found");
            }

            if (exam.Status == ExamStatus.Active || exam.Status == ExamStatus.Completed)
            {
                return BadRequest("Cannot reorder questions in a published or completed exam");
            }

            var success = await _examService.ReorderExamQuestionsAsync(id, dto.QuestionIds);
            
            if (!success)
            {
                return BadRequest("Invalid question order. Ensure all exam questions are included exactly once.");
            }

            return Ok("Questions reordered successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering questions for exam {ExamId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPatch("{id}/revert-to-draft")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> RevertToDraft(int id)
    {
        try
        {
            var success = await _examService.RevertExamToDraftAsync(id);
            
            if (!success)
            {
                return NotFound("Exam not found");
            }

            return Ok("Exam reverted to draft successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reverting exam {ExamId} to draft", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPatch("{id}/publish")]
    [Authorize(Roles = "Admin,Instructor")]
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
