using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface IBatchRepository : IRepository<Batch>
{
    Task<IEnumerable<Batch>> GetBatchesWithCourseAsync();
    Task<IEnumerable<Batch>> GetBatchesForInstructorAsync(int instructorId);
    Task<Batch?> GetCurrentBatchForInstructorAsync(int instructorId);
}
