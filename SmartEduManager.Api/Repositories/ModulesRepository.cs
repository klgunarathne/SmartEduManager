using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class ModulesRepository : Repository<Models.Modules>, IModulesRepository
{
    public ModulesRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Models.Modules>> GetModulesWithTasksAsync()
    {
        return await _context.Modules
            .Include(m => m.Tasks)
            .ToListAsync();
    }

    public async Task<IEnumerable<Models.Modules>> GetModulesByNCSIdAsync(int ncsId)
    {
        return await _context.Modules
            .Where(m => m.NCSId == ncsId)
            .Include(m => m.Tasks)
            .ToListAsync();
    }
}
