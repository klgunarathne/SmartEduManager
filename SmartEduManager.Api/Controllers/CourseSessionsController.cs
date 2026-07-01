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
public class CourseSessionsController : ControllerBase
{
    private readonly ICourseSessionRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<CourseSessionsController> _logger;

    public CourseSessionsController(ICourseSessionRepository repository, IMapper mapper, ILogger<CourseSessionsController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetSessions([FromQuery] TimetableQueryParams query)
    {
        try
        {
            IEnumerable<Appointment> sessions;

            if (query.BatchId.HasValue && query.Start.HasValue && query.End.HasValue)
            {
                sessions = await _repository.GetSessionsByBatchAndDateRangeAsync(query.BatchId.Value, query.Start.Value, query.End.Value);
            }
            else if (query.BatchId.HasValue)
            {
                sessions = await _repository.GetSessionsByBatchAsync(query.BatchId.Value);
            }
            else
            {
                sessions = await _repository.GetAllAsync();
                var result = ((Repository<Appointment>)_repository).GetAll()
                    .Include(s => s.Batch)
                    .Include(s => s.Course)
                    .Include(s => s.Instructor)
                    .Include(s => s.Center)
                    .Include(s => s.Module)
                    .Include(s => s.Items)
                    .OrderByDescending(s => s.StartDateTime);
                sessions = await result.ToListAsync();
            }

            var sessionsDto = _mapper.Map<IEnumerable<CourseSessionDto>>(sessions);
            return Ok(sessionsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving course sessions");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSession(int id)
    {
        try
        {
            var session = await _repository.GetByIdAsync(id);
            if (session == null)
            {
                _logger.LogWarning($"Session with id {id} not found");
                return NotFound("Session not found");
            }

            var sessionDto = _mapper.Map<CourseSessionDto>(session);
            return Ok(sessionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving session with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("batch/{batchId}")]
    public async Task<IActionResult> GetSessionsByBatch(int batchId)
    {
        try
        {
            var sessions = await _repository.GetSessionsByBatchAsync(batchId);
            var sessionsDto = _mapper.Map<IEnumerable<CourseSessionDto>>(sessions);
            return Ok(sessionsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving sessions for batch {batchId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("instructor/{instructorId}")]
    public async Task<IActionResult> GetSessionsByInstructor(int instructorId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        try
        {
            var sessions = await _repository.GetSessionsByInstructorAsync(instructorId, from, to);
            var sessionsDto = _mapper.Map<IEnumerable<CourseSessionDto>>(sessions);
            return Ok(sessionsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving sessions for instructor {instructorId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("center/{centerId}")]
    public async Task<IActionResult> GetSessionsByCenter(int centerId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        try
        {
            var sessions = await _repository.GetSessionsByCenterAsync(centerId, from, to);
            var sessionsDto = _mapper.Map<IEnumerable<CourseSessionDto>>(sessions);
            return Ok(sessionsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving sessions for center {centerId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> CreateSession([FromBody] CreateCourseSessionDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var session = _mapper.Map<Appointment>(createDto);
            session.CreatedAt = DateTime.UtcNow;

            await _repository.AddAsync(session);
            await _repository.SaveChangesAsync();

            var sessionDto = _mapper.Map<CourseSessionDto>(session);
            _logger.LogInformation($"Created session with id {session.AppointmentId}");
            return CreatedAtAction(nameof(GetSession), new { id = session.AppointmentId }, sessionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating session");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UpdateSession(int id, [FromBody] UpdateCourseSessionDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var session = await _repository.GetByIdAsync(id);
            if (session == null)
            {
                _logger.LogWarning($"Session with id {id} not found");
                return NotFound("Session not found");
            }

            _mapper.Map(updateDto, session);
            session.UpdatedAt = DateTime.UtcNow;

            _repository.Update(session);
            await _repository.SaveChangesAsync();

            var sessionDto = _mapper.Map<CourseSessionDto>(session);
            _logger.LogInformation($"Updated session with id {id}");
            return Ok(sessionDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating session with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSession(int id)
    {
        try
        {
            var session = await _repository.GetByIdAsync(id);
            if (session == null)
            {
                _logger.LogWarning($"Session with id {id} not found");
                return NotFound("Session not found");
            }

            _repository.Delete(session);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Deleted session with id {id}");
            return Ok("Session deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting session with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("check-conflicts")]
    public async Task<IActionResult> CheckConflicts([FromBody] ConflictCheckRequestDto request)
    {
        try
        {
            var conflicts = await ((ICourseSessionRepository)_repository)
                .GetConflictingSessionsAsync(request.InstructorId, request.CenterId, request.BatchId, request.StartDateTime, request.EndDateTime, request.ExcludeAppointmentId);

            var result = new ConflictCheckResultDto
            {
                HasConflict = conflicts.Any(),
                Conflicts = conflicts.ToList()
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking conflicts");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("generate-timetable")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GenerateTimetable([FromBody] GenerateTimetableRequestDto request)
    {
        try
        {
            var generatedSessions = new List<Appointment>();

            var currentDate = request.StartDate.Date;
            while (currentDate <= request.EndDate.Date)
            {
                if (!request.ExcludedDays.Contains((int)currentDate.DayOfWeek))
                {
                    var batch = await _context.Batches.FindAsync(request.BatchId);
                    if (batch != null && currentDate >= batch.StartDate.Date && currentDate <= batch.EndDate.Date)
                    {
                        foreach (var module in request.Modules)
                        {
                            var theorySessions = module.TheoryHours / module.SessionDurationMinutes * 60;
                            var practicalSessions = module.PracticalHours / module.SessionDurationMinutes * 60;

                            for (int i = 0; i < theorySessions; i++)
                            {
                                var session = new Appointment
                                {
                                    Text = $"{module.ModuleName} - Theory",
                                    Description = $"Auto-generated theory session for {module.ModuleName}",
                                    StartDateTime = currentDate.AddHours(8 + i * 2),
                                    EndDateTime = currentDate.AddHours(8 + i * 2 + 2),
                                    AllDay = false,
                                    SessionType = "Theory",
                                    Status = "Scheduled",
                                    IsPublished = false,
                                    BatchId = request.BatchId,
                                    CourseId = batch.CourseId,
                                    InstructorId = request.InstructorId,
                                    CenterId = request.CenterId,
                                    ModuleId = module.ModuleId,
                                    CreatedAt = DateTime.UtcNow
                                };
                                generatedSessions.Add(session);
                            }

                            for (int i = 0; i < practicalSessions; i++)
                            {
                                var session = new Appointment
                                {
                                    Text = $"{module.ModuleName} - Practical",
                                    Description = $"Auto-generated practical session for {module.ModuleName}",
                                    StartDateTime = currentDate.AddHours(10 + i * 2),
                                    EndDateTime = currentDate.AddHours(10 + i * 2 + 2),
                                    AllDay = false,
                                    SessionType = "Practical",
                                    Status = "Scheduled",
                                    IsPublished = false,
                                    BatchId = request.BatchId,
                                    CourseId = batch.CourseId,
                                    InstructorId = request.InstructorId,
                                    CenterId = request.CenterId,
                                    ModuleId = module.ModuleId,
                                    CreatedAt = DateTime.UtcNow
                                };
                                generatedSessions.Add(session);
                            }
                        }
                    }
                }
                currentDate = currentDate.AddDays(1);
            }

            await _repository.AddRangeAsync(generatedSessions);
            await _repository.SaveChangesAsync();

            var sessionDtos = _mapper.Map<IEnumerable<CourseSessionDto>>(generatedSessions);
            _logger.LogInformation($"Generated {generatedSessions.Count} sessions for batch {request.BatchId}");
            return Ok(sessionDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating timetable");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("publish/{id}")]
    public async Task<IActionResult> PublishSession(int id)
    {
        try
        {
            var session = await _repository.GetByIdAsync(id);
            if (session == null)
            {
                _logger.LogWarning($"Session with id {id} not found");
                return NotFound("Session not found");
            }

            session.IsPublished = true;
            session.UpdatedAt = DateTime.UtcNow;
            _repository.Update(session);
            await _repository.SaveChangesAsync();

            _logger.LogInformation($"Published session with id {id}");
            return Ok("Session published successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error publishing session with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }
}
