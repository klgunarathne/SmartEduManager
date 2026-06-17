using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;
using System.Security.Claims;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ExamAttemptsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IExamRepository _examRepository;
    private readonly ILogger<ExamAttemptsController> _logger;

    public ExamAttemptsController(
        AppDbContext context,
        IExamRepository examRepository,
        ILogger<ExamAttemptsController> logger)
    {
        _context = context;
        _examRepository = examRepository;
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

            var exam = await _context.Exams
                .Include(e => e.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
                .FirstOrDefaultAsync(e => e.Id == dto.ExamId);

            if (exam == null)
            {
                return NotFound("Exam not found");
            }

            if (exam.Status != ExamStatus.Active && exam.Status != ExamStatus.Scheduled)
            {
                return BadRequest("Exam is not available");
            }

            if (exam.AvailableFrom.HasValue && exam.AvailableFrom.Value > DateTime.UtcNow)
            {
                return BadRequest("Exam has not started yet");
            }

            if (exam.AvailableTo.HasValue && exam.AvailableTo.Value < DateTime.UtcNow)
            {
                return BadRequest("Exam has ended");
            }

            var existingAttempt = await _context.ExamAttempts
                .Include(a => a.Exam)
                .ThenInclude(e => e.ExamQuestions)
                    .ThenInclude(eq => eq.Question)
                .FirstOrDefaultAsync(a => a.ExamId == dto.ExamId && a.StudentId == userId && !a.IsCompleted);

            if (existingAttempt != null)
            {
                var existingQuestions = existingAttempt.Exam.ExamQuestions
                    .OrderBy(eq => eq.Order)
                    .Select(eq => new ExamQuestionDto
                    {
                        Id = eq.Id,
                        ExamId = eq.ExamId,
                        QuestionId = eq.QuestionId,
                        Order = eq.Order,
                        Question = eq.Question != null ? new QuestionDto
                        {
                            Id = eq.Question.Id,
                            Content = eq.Question.Content,
                            Type = eq.Question.Type.ToString().ToLowerInvariant(),
                            Difficulty = eq.Question.Difficulty.ToString().ToLowerInvariant(),
                            CategoryId = eq.Question.CategoryId,
                            Marks = eq.Question.Marks,
                            Options = eq.Question.Options != null ? eq.Question.Options.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToArray() : Array.Empty<string>(),
                            CorrectAnswer = eq.Question.CorrectAnswer,
                            Explanation = eq.Question.Explanation,
                            Tags = eq.Question.Tags
                        } : null
                    })
                    .ToList();

                var resumeResult = new ExamAttemptDto
                {
                    Id = existingAttempt.Id,
                    ExamId = existingAttempt.ExamId,
                    StudentId = existingAttempt.StudentId,
                    StartedAt = existingAttempt.StartedAt,
                    Status = existingAttempt.Status,
                    TotalMarks = existingAttempt.TotalMarks,
                    Exam = new ExamDto
                    {
                        Id = existingAttempt.Exam.Id,
                        Title = existingAttempt.Exam.Title,
                        Description = existingAttempt.Exam.Description,
                        Duration = existingAttempt.Exam.Duration,
                        QuestionCount = existingAttempt.Exam.ExamQuestions.Count,
                        TotalMarks = existingAttempt.Exam.ExamQuestions.Sum(eq => eq.Question.Marks),
                        Status = existingAttempt.Exam.Status.ToString().ToLowerInvariant(),
                        AvailableFrom = existingAttempt.Exam.AvailableFrom,
                        AvailableTo = existingAttempt.Exam.AvailableTo,
                        TimeZone = existingAttempt.Exam.TimeZone,
                        Questions = existingQuestions
                    }
                };

                return Ok(resumeResult);
            }

            var attempt = new ExamAttempt
            {
                ExamId = dto.ExamId,
                StudentId = userId,
                StartedAt = DateTime.UtcNow,
                Status = "InProgress",
                TotalMarks = exam.ExamQuestions.Sum(eq => eq.Question.Marks)
            };

            _context.ExamAttempts.Add(attempt);
            await _context.SaveChangesAsync();

            var questions = exam.ExamQuestions
                .OrderBy(eq => eq.Order)
                    .Select(eq => new ExamQuestionDto
                    {
                        Id = eq.Id,
                        ExamId = eq.ExamId,
                        QuestionId = eq.QuestionId,
                        Order = eq.Order,
                        Question = eq.Question != null ? new QuestionDto
                        {
                            Id = eq.Question.Id,
                            Content = eq.Question.Content,
                            Type = eq.Question.Type.ToString().ToLowerInvariant(),
                            Difficulty = eq.Question.Difficulty.ToString().ToLowerInvariant(),
                            CategoryId = eq.Question.CategoryId,
                            Marks = eq.Question.Marks,
                            Options = eq.Question.Options != null ? eq.Question.Options.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToArray() : Array.Empty<string>(),
                            CorrectAnswer = eq.Question.CorrectAnswer,
                            Explanation = eq.Question.Explanation,
                            Tags = eq.Question.Tags
                        } : null
                    })
                .ToList();

            var result = new ExamAttemptDto
            {
                Id = attempt.Id,
                ExamId = attempt.ExamId,
                StudentId = attempt.StudentId,
                StartedAt = attempt.StartedAt,
                Status = attempt.Status,
                TotalMarks = attempt.TotalMarks,
                Exam = new ExamDto
                {
                    Id = exam.Id,
                    Title = exam.Title,
                    Description = exam.Description,
                    Duration = exam.Duration,
                    QuestionCount = exam.ExamQuestions.Count,
                    TotalMarks = exam.ExamQuestions.Sum(eq => eq.Question.Marks),
                    Status = exam.Status.ToString().ToLowerInvariant(),
                    AvailableFrom = exam.AvailableFrom,
                    AvailableTo = exam.AvailableTo,
                    TimeZone = exam.TimeZone,
                    Questions = questions
                }
            };

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

            var attempt = await _context.ExamAttempts
                .Include(a => a.Exam)
                .Include(a => a.Answers)
                .FirstOrDefaultAsync(a => a.Id == dto.ExamAttemptId && a.StudentId == userId);

            if (attempt == null)
            {
                return NotFound("Exam attempt not found");
            }

            if (attempt.IsCompleted)
            {
                return BadRequest("Exam already submitted");
            }

            var examQuestions = await _context.ExamQuestions
                .Include(eq => eq.Question)
                .Where(eq => eq.ExamId == attempt.ExamId)
                .ToListAsync();

            var questionMap = examQuestions.ToDictionary(eq => eq.QuestionId);

            _context.ExamAnswers.RemoveRange(attempt.Answers);
            var newAnswers = new List<ExamAnswer>();
            int totalScore = 0;

            foreach (var answer in dto.Answers)
            {
                if (!questionMap.TryGetValue(answer.QuestionId, out var examQuestion) || examQuestion.Question == null)
                {
                    continue;
                }

                var question = examQuestion.Question;
                var correctAnswers = (question.CorrectAnswer ?? string.Empty)
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .ToHashSet();

                var selectedAnswers = (answer.SelectedAnswer ?? string.Empty)
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .ToHashSet();

                bool isCorrect = selectedAnswers.Count == correctAnswers.Count &&
                    selectedAnswers.All(ca => correctAnswers.Contains(ca));

                int marksObtained = isCorrect ? question.Marks : 0;
                totalScore += marksObtained;

                var examAnswer = new ExamAnswer
                {
                    ExamAttemptId = attempt.Id,
                    QuestionId = answer.QuestionId,
                    SelectedAnswer = answer.SelectedAnswer,
                    IsCorrect = isCorrect,
                    MarksObtained = marksObtained
                };

                newAnswers.Add(examAnswer);
            }

            _context.ExamAnswers.AddRange(newAnswers);

            attempt.SubmittedAt = DateTime.UtcNow;
            attempt.IsCompleted = true;
            attempt.Score = totalScore;
            attempt.Status = "Completed";

            await _context.SaveChangesAsync();

            var result = new ExamResultDto
            {
                Id = attempt.Id,
                ExamId = attempt.ExamId,
                ExamTitle = attempt.Exam?.Title ?? string.Empty,
                Score = attempt.Score,
                TotalMarks = attempt.TotalMarks,
                Percentage = attempt.TotalMarks > 0 ? (double)attempt.Score / attempt.TotalMarks * 100 : 0,
                Status = attempt.Status,
                StartedAt = attempt.StartedAt,
                SubmittedAt = attempt.SubmittedAt,
                Answers = newAnswers.Select(a =>
                {
                    var q = questionMap[a.QuestionId]?.Question;
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
                }).ToList()
            };

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

            var attempts = await _context.ExamAttempts
                .Include(a => a.Exam)
                .Where(a => a.StudentId == userId && a.IsCompleted)
                .OrderByDescending(a => a.SubmittedAt)
                .Select(a => new ExamResultDto
                {
                    Id = a.Id,
                    ExamId = a.ExamId,
                    ExamTitle = a.Exam!.Title,
                    Score = a.Score,
                    TotalMarks = a.TotalMarks,
                    Percentage = a.TotalMarks > 0 ? (double)a.Score / a.TotalMarks * 100 : 0,
                    Status = a.Status,
                    StartedAt = a.StartedAt,
                    SubmittedAt = a.SubmittedAt
                })
                .ToListAsync();

            return Ok(attempts);
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

            var attempt = await _context.ExamAttempts
                .Include(a => a.Exam)
                .Include(a => a.Answers)
                .FirstOrDefaultAsync(a => a.Id == id && a.StudentId == userId && a.IsCompleted);

            if (attempt == null)
            {
                return NotFound("Result not found");
            }

            var questionMap = await _context.ExamQuestions
                .Include(eq => eq.Question)
                .Where(eq => eq.ExamId == attempt.ExamId)
                .ToDictionaryAsync(eq => eq.QuestionId);

            var result = new ExamResultDto
            {
                Id = attempt.Id,
                ExamId = attempt.ExamId,
                ExamTitle = attempt.Exam?.Title ?? string.Empty,
                Score = attempt.Score,
                TotalMarks = attempt.TotalMarks,
                Percentage = attempt.TotalMarks > 0 ? (double)attempt.Score / attempt.TotalMarks * 100 : 0,
                Status = attempt.Status,
                StartedAt = attempt.StartedAt,
                SubmittedAt = attempt.SubmittedAt,
                Answers = attempt.Answers.Select(a =>
                {
                    var q = questionMap.TryGetValue(a.QuestionId, out var eq) ? eq.Question : null;
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
                }).ToList()
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting result");
            return StatusCode(500, "Internal server error");
        }
    }
}
