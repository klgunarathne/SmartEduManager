using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class AttendanceRepository : Repository<Attendance>, IAttendanceRepository
{
    public AttendanceRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Attendance>> GetAttendanceByBatchAsync(int batchId)
    {
        return await _dbSet
            .Include(a => a.Student)
            .Include(a => a.Batch)
            .Where(a => a.BatchId == batchId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Attendance>> GetAttendanceByStudentAsync(int studentId)
    {
        return await _dbSet
            .Include(a => a.Student)
            .Include(a => a.Batch)
            .Where(a => a.StudentId == studentId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Attendance>> GetAttendanceByDateRangeAsync(int batchId, DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Include(a => a.Student)
            .Include(a => a.Batch)
            .Where(a => a.BatchId == batchId && a.Date >= startDate && a.Date <= endDate)
            .ToListAsync();
    }

    public async Task<Attendance?> GetAttendanceByStudentAndDateAsync(int studentId, DateTime date)
    {
        return await _dbSet
            .Include(a => a.Student)
            .Include(a => a.Batch)
            .FirstOrDefaultAsync(a => a.StudentId == studentId && a.Date.Date == date.Date);
    }

    public async Task<IEnumerable<object>> GetBatchAttendanceSummaryAsync(int batchId, DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Include(a => a.Student)
            .Where(a => a.BatchId == batchId && a.Date >= startDate && a.Date <= endDate)
            .GroupBy(a => new { a.StudentId, a.Student.FullName, a.Student.MISNo })
            .Select(g => new
            {
                StudentId = g.Key.StudentId,
                StudentName = g.Key.FullName,
                MISNo = g.Key.MISNo,
                TotalDays = g.Count(),
                PresentCount = g.Count(a => a.IsPresent),
                AbsentCount = g.Count(a => !a.IsPresent),
                AttendancePercentage = Math.Round((double)g.Count(a => a.IsPresent) / g.Count() * 100, 2)
            })
            .ToListAsync<object>();
    }

    public override IQueryable<Attendance> GetAll()
    {
        return _dbSet;
    }
}