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

    public async Task<IEnumerable<Batch>> GetBatchesForInstructorAsync(int instructorId)
    {
        var courseIds = await _context.CourseInstructors
            .Where(ci => ci.InstructorId == instructorId)
            .Select(ci => ci.CourseId)
            .ToListAsync();

        if (!courseIds.Any())
            return Enumerable.Empty<Batch>();

        return await _context.Batches
            .Where(b => courseIds.Contains(b.CourseId))
            .Include(b => b.Course)
            .ToListAsync();
    }

    public async Task<Batch?> GetCurrentBatchForInstructorAsync(int instructorId)
    {
        var today = DateTime.Today;

        var courseIds = await _context.CourseInstructors
            .Where(ci => ci.InstructorId == instructorId)
            .Select(ci => ci.CourseId)
            .ToListAsync();

        if (!courseIds.Any())
            return null;

        return await _context.Batches
            .Where(b => courseIds.Contains(b.CourseId) && b.StartDate <= today && b.EndDate >= today)
            .Include(b => b.Course)
            .OrderByDescending(b => b.StartDate)
            .FirstOrDefaultAsync();
    }
}
