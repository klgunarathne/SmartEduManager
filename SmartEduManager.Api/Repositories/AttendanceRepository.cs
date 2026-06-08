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
}