using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface IBatchRepository : IRepository<Batch>
{
    Task<IEnumerable<Batch>> GetBatchesWithCourseAsync();
}
