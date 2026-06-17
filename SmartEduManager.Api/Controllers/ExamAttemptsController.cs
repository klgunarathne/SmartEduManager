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
[Authorize]
public class ExamAttemptsController : ControllerBase
{
    private readonly IExamService _examService;
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ExamAttemptsController> _logger;

    public ExamAttemptsController(
        IExamService examService,
        AppDbContext context,
        IMapper mapper,
        ILogger<ExamAttemptsController> logger)
    {
        _examService = examService;
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartExam([FromBody] StartExamDto dto)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var existingAttempt = await _context.ExamAttempts
                .Include(a => a.Exam)
                    .ThenInclude(e => e!.ExamQuestions)
                        .ThenInclude(eq => eq.Question)
                .FirstOrDefaultAsync(a => a.ExamId == dto.ExamId && a.StudentId == userId && !a.IsCompleted);

            if (existingAttempt != null)
            {
                var examAttemptDto = _mapper.Map<ExamAttemptDto>(existingAttempt);
                return Ok(examAttemptDto);
            }

            var result = await _examService.StartExamAsync(dto.ExamId, userId);

            if (result == null)
            {
                return BadRequest("Exam is not available or has not started yet");
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting exam");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("submit")]
    public async Task<IActionResult> SubmitExam([FromBody] SubmitExamDto dto)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var result = await _examService.SubmitExamAsync(dto.ExamAttemptId, userId, dto.Answers);

            if (result == null)
            {
                return NotFound("Exam attempt not found or already submitted");
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting exam");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("my-results")]
    public async Task<IActionResult> GetMyResults()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var results = await _examService.GetStudentResultsAsync(userId);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting results");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("results/{id}")]
    public async Task<IActionResult> GetResult(int id)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var result = await _examService.GetResultAsync(id, userId);

            if (result == null)
            {
                return NotFound("Result not found");
            }

            var questionMap = await _context.ExamQuestions
                .Include(eq => eq.Question)
                .Where(eq => eq.ExamId == result.ExamId)
                .ToDictionaryAsync(eq => eq.QuestionId);

            var answers = (result.Answers ?? Enumerable.Empty<ExamAnswerResultDto>()).Select(a =>
            {
                var q = questionMap.TryGetValue(a.QuestionId, out var eq) && eq != null ? eq.Question : null;
                return new ExamAnswerResultDto
                {
                    QuestionId = a.QuestionId,
                    QuestionContent = q?.Content ?? "Unknown question",
                    SelectedAnswer = a.SelectedAnswer,
                    CorrectAnswer = q?.CorrectAnswer ?? string.Empty,
                    IsCorrect = a.IsCorrect,
                    MarksObtained = a.MarksObtained,
                    TotalMarks = q?.Marks ?? 0
                };
            }).ToList();

            var finalResult = _mapper.Map<ExamResultDto>(result);
            finalResult.Answers = answers;

            return Ok(finalResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting result");
            return StatusCode(500, "Internal server error");
        }
    }
}