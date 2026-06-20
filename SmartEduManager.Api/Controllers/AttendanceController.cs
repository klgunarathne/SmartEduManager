using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;
using System.Globalization;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<AttendanceController> _logger;
    private readonly AppDbContext _context;

    public AttendanceController(IAttendanceRepository repository, IMapper mapper, ILogger<AttendanceController> logger, AppDbContext context)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
        _context = context;
    }

    [HttpGet("batch/{batchId}")]
    public async Task<IActionResult> GetAttendanceByBatch(int batchId)
    {
        try
        {
            var attendance = await _repository.GetAttendanceByBatchAsync(batchId);
            var attendanceDto = _mapper.Map<IEnumerable<AttendanceDto>>(attendance);
            return Ok(attendanceDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving attendance for batch {batchId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("student/{studentId}")]
    [Authorize(Roles = "Admin,Instructor,Student")]
    public async Task<IActionResult> GetAttendanceByStudent(int studentId)
    {
        try
        {
            var attendance = await _repository.GetAttendanceByStudentAsync(studentId);
            var attendanceDto = _mapper.Map<IEnumerable<AttendanceDto>>(attendance);
            return Ok(attendanceDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving attendance for student {studentId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> CreateAttendance([FromBody] CreateAttendanceDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var studentBelongsToBatch = await _context.Students
                .AnyAsync(s => s.StudentId == createDto.StudentId && s.BatchId == createDto.BatchId);

            if (!studentBelongsToBatch)
            {
                return BadRequest("Student does not belong to the selected batch");
            }

            var attendance = _mapper.Map<Attendance>(createDto);
            attendance.Date = createDto.Date.Date;
            await _repository.AddAsync(attendance);
            await _repository.SaveChangesAsync();

            var attendanceDto = _mapper.Map<AttendanceDto>(attendance);
            return CreatedAtAction(nameof(GetAttendanceByBatch), new { batchId = attendance.BatchId }, attendanceDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating attendance");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> UpdateAttendance(int id, [FromBody] UpdateAttendanceDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var attendance = await _repository.GetByIdAsync(id);
            if (attendance == null)
            {
                return NotFound("Attendance record not found");
            }

            if (updateDto.IsPresent.HasValue)
            {
                attendance.IsPresent = updateDto.IsPresent.Value;
            }

            if (updateDto.Remarks is not null)
            {
                attendance.Remarks = updateDto.Remarks;
            }

            _repository.Update(attendance);
            await _repository.SaveChangesAsync();

            return Ok("Attendance updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating attendance with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> DeleteAttendance(int id)
    {
        try
        {
            var attendance = await _repository.GetByIdAsync(id);
            if (attendance == null)
            {
                return NotFound("Attendance record not found");
            }

            _repository.Delete(attendance);
            await _repository.SaveChangesAsync();

            return Ok("Attendance deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting attendance with id {id}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("batch/{batchId}/summary")]
    public async Task<IActionResult> GetBatchAttendanceSummary(int batchId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        try
        {
            var start = startDate ?? new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            var end = endDate ?? start.AddMonths(1).AddDays(-1);

            var summary = await _repository.GetBatchAttendanceSummaryAsync(batchId, start, end);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving attendance summary for batch {batchId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("day/{date}/student/{studentId}/batch/{batchId}")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> DeleteAttendanceByStudent(string date, int studentId, int batchId)
    {
        try
        {
            if (!DateTime.TryParse(date, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsedDate))
            {
                return BadRequest("Invalid date format");
            }

            var attendance = await _repository.GetAttendanceByStudentAndDateAsync(
                studentId, 
                parsedDate
            );
            if (attendance == null || attendance.BatchId != batchId)
            {
                return NotFound("Attendance record not found");
            }

            _repository.Delete(attendance);
            await _repository.SaveChangesAsync();

            return Ok("Attendance deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting attendance for student {studentId} on {date}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("day/{date}/batch/{batchId}")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> DeleteAttendanceForDay(string date, int batchId)
    {
        try
        {
            if (!DateTime.TryParse(date, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsedDate))
            {
                return BadRequest("Invalid date format");
            }

            var attendanceDate = parsedDate.Date;
            var attendance = await _repository.GetAll()
                .Where(a => a.Date >= attendanceDate && a.Date < attendanceDate.AddDays(1) && a.BatchId == batchId)
                .ToListAsync();

            if (attendance.Count == 0)
            {
                return NotFound("Attendance records not found");
            }
            
            foreach (var a in attendance)
            {
                _repository.Delete(a);
            }
            await _repository.SaveChangesAsync();

            return Ok("Attendance cleared for the day");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error clearing attendance for day {date} in batch {batchId}");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("batch/{batchId}")]
    [Authorize(Roles = "Instructor")]
    public async Task<IActionResult> DeleteAttendanceForBatch(int batchId)
    {
        try
        {
            var attendance = await _repository.GetAll()
                .Where(a => a.BatchId == batchId)
                .ToListAsync();

            if (attendance.Count == 0)
            {
                return NotFound("Attendance records not found");
            }

            foreach (var a in attendance)
            {
                _repository.Delete(a);
            }
            await _repository.SaveChangesAsync();

            return Ok("All attendance records deleted for batch");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting all attendance for batch {batchId}");
            return StatusCode(500, "Internal server error");
        }
    }
}