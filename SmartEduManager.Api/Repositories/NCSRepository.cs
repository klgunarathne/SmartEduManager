using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class NCSRepository : Repository<NCS>, INCSRepository
{
    public NCSRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<NCS>> GetNCSWithModulesAsync()
    {
        return await _context.NCS
            .Include(n => n.Course)
            .Include(n => n.Modules)
            .ThenInclude(m => m.Tasks)
            .ToListAsync();
    }

    public async Task<NCS?> GetNCSWithCourseAndModulesAsync(int id)
    {
        return await _context.NCS
            .Include(n => n.Course)
            .Include(n => n.Modules)
            .ThenInclude(m => m.Tasks)
            .FirstOrDefaultAsync(n => n.Id == id);
    }

    public async Task<IEnumerable<NCS>> GetNCSByCourseIdAsync(int courseId)
    {
        return await _context.NCS
            .Where(n => n.CourseId == courseId)
            .Include(n => n.Course)
            .Include(n => n.Modules)
            .ThenInclude(m => m.Tasks)
            .ToListAsync();
    }
}
