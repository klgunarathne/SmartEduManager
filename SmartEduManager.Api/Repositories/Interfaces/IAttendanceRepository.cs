using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface IAttendanceRepository : IRepository<Attendance>
{
    Task<IEnumerable<Attendance>> GetAttendanceByBatchAsync(int batchId);
    Task<IEnumerable<Attendance>> GetAttendanceByStudentAsync(int studentId);
    Task<IEnumerable<Attendance>> GetAttendanceByDateRangeAsync(int batchId, DateTime startDate, DateTime endDate);
    Task<Attendance?> GetAttendanceByStudentAndDateAsync(int studentId, DateTime date);
    Task<IEnumerable<object>> GetBatchAttendanceSummaryAsync(int batchId, DateTime startDate, DateTime endDate);
    IQueryable<Attendance> GetAll();
}