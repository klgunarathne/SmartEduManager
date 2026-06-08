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
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceRepository _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<AttendanceController> _logger;

    public AttendanceController(IAttendanceRepository repository, IMapper mapper, ILogger<AttendanceController> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
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

            var attendance = _mapper.Map<Attendance>(createDto);
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

            _mapper.Map(updateDto, attendance);
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
}