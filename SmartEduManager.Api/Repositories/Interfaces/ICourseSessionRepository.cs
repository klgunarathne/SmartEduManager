using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Repositories;

public interface ICourseSessionRepository : IRepository<Appointment>
{
    Task<IEnumerable<Appointment>> GetSessionsByBatchAsync(int batchId);
    Task<IEnumerable<Appointment>> GetSessionsByBatchAndDateRangeAsync(int batchId, DateTime start, DateTime end);
    Task<IEnumerable<Appointment>> GetSessionsByInstructorAsync(int instructorId, DateTime? from = null, DateTime? to = null);
    Task<IEnumerable<Appointment>> GetSessionsByCenterAsync(int centerId, DateTime? from = null, DateTime? to = null);
    Task<IEnumerable<ConflictDto>> GetConflictingSessionsAsync(int? instructorId, int? centerId, int batchId, DateTime start, DateTime end, int? excludeAppointmentId = null);
    Task<IEnumerable<Appointment>> GetBatchTimetableAsync(int batchId, DateTime start, DateTime end);
    Task<PagedResult<Appointment>> GetPagedAsync(int page, int pageSize, int? batchId = null, string? sessionType = null, string? status = null);
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class CourseSessionRepository : Repository<Appointment>, ICourseSessionRepository
{
    public CourseSessionRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Appointment>> GetSessionsByBatchAsync(int batchId)
    {
        return await _dbSet
            .Where(s => s.BatchId == batchId)
            .Include(s => s.Batch)
            .Include(s => s.Course)
            .Include(s => s.Instructor)
            .Include(s => s.Center)
            .Include(s => s.Module)
            .Include(s => s.Items)
            .OrderByDescending(s => s.StartDateTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetSessionsByBatchAndDateRangeAsync(int batchId, DateTime start, DateTime end)
    {
        return await _dbSet
            .Where(s => s.BatchId == batchId && s.StartDateTime >= start && s.EndDateTime <= end)
            .Include(s => s.Batch)
            .Include(s => s.Course)
            .Include(s => s.Instructor)
            .Include(s => s.Center)
            .Include(s => s.Module)
            .Include(s => s.Items)
            .OrderBy(s => s.StartDateTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetSessionsByInstructorAsync(int instructorId, DateTime? from = null, DateTime? to = null)
    {
        var query = _dbSet.Where(s => s.InstructorId == instructorId);

        if (from.HasValue)
            query = query.Where(s => s.EndDateTime >= from.Value);

        if (to.HasValue)
            query = query.Where(s => s.StartDateTime <= to.Value);

        return await query
            .Include(s => s.Batch)
            .Include(s => s.Course)
            .Include(s => s.Instructor)
            .Include(s => s.Center)
            .Include(s => s.Module)
            .Include(s => s.Items)
            .OrderBy(s => s.StartDateTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetSessionsByCenterAsync(int centerId, DateTime? from = null, DateTime? to = null)
    {
        var query = _dbSet.Where(s => s.CenterId == centerId);

        if (from.HasValue)
            query = query.Where(s => s.EndDateTime >= from.Value);

        if (to.HasValue)
            query = query.Where(s => s.StartDateTime <= to.Value);

        return await query
            .Include(s => s.Batch)
            .Include(s => s.Course)
            .Include(s => s.Instructor)
            .Include(s => s.Center)
            .Include(s => s.Module)
            .Include(s => s.Items)
            .OrderBy(s => s.StartDateTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<ConflictDto>> GetConflictingSessionsAsync(int? instructorId, int? centerId, int batchId, DateTime start, DateTime end, int? excludeAppointmentId = null)
    {
        var query = _dbSet
            .Where(s => s.BatchId == batchId && s.StartDateTime < end && s.EndDateTime > start);

        if (excludeAppointmentId.HasValue)
            query = query.Where(s => s.AppointmentId != excludeAppointmentId.Value);

        var conflicts = new List<ConflictDto>();

        if (instructorId.HasValue)
        {
            var instructorConflicts = await query
                .Where(s => s.InstructorId == instructorId.Value)
                .Select(s => new ConflictDto
                {
                    AppointmentId = s.AppointmentId,
                    Text = s.Text,
                    StartDateTime = s.StartDateTime,
                    EndDateTime = s.EndDateTime,
                    ConflictType = "instructor"
                })
                .ToListAsync();
            conflicts.AddRange(instructorConflicts);
        }

        if (centerId.HasValue)
        {
            var centerConflicts = await query
                .Where(s => s.CenterId == centerId.Value)
                .Select(s => new ConflictDto
                {
                    AppointmentId = s.AppointmentId,
                    Text = s.Text,
                    StartDateTime = s.StartDateTime,
                    EndDateTime = s.EndDateTime,
                    ConflictType = "center"
                })
                .ToListAsync();
            conflicts.AddRange(centerConflicts);
        }

        return conflicts;
    }

    public async Task<IEnumerable<Appointment>> GetBatchTimetableAsync(int batchId, DateTime start, DateTime end)
    {
        return await _dbSet
            .Where(s => s.BatchId == batchId && s.StartDateTime >= start && s.StartDateTime <= end)
            .Include(s => s.Batch)
            .Include(s => s.Course)
            .Include(s => s.Instructor)
            .Include(s => s.Center)
            .Include(s => s.Module)
            .Include(s => s.Items)
            .OrderBy(s => s.StartDateTime)
            .ToListAsync();
    }

    public async Task<PagedResult<Appointment>> GetPagedAsync(int page, int pageSize, int? batchId = null, string? sessionType = null, string? status = null)
    {
        var query = _dbSet
            .Include(s => s.Batch)
            .Include(s => s.Course)
            .Include(s => s.Instructor)
            .Include(s => s.Center)
            .Include(s => s.Module)
            .Include(s => s.Items)
            .AsQueryable();

        if (batchId.HasValue)
            query = query.Where(s => s.BatchId == batchId.Value);

        if (!string.IsNullOrEmpty(sessionType))
            query = query.Where(s => s.SessionType == sessionType);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(s => s.Status == status);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.StartDateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Appointment>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}
