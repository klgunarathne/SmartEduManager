using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class BatchRepository : Repository<Batch>, IBatchRepository
{
    public BatchRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Batch>> GetBatchesWithCourseAsync()
    {
        return await _context.Batches.Include(b => b.Course).ToListAsync();
    }
}
