using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class ModuleTaskRepository : Repository<ModuleTask>, IModuleTaskRepository
{
    public ModuleTaskRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ModuleTask>> GetModuleTasksByModuleIdAsync(int moduleId)
    {
        return await _context.ModuleTasks
            .Where(t => t.ModuleId == moduleId)
            .Include(t => t.Module)
            .ToListAsync();
    }

    public override async Task<IEnumerable<ModuleTask>> GetAllAsync()
    {
        return await _context.ModuleTasks
            .Include(t => t.Module)
            .ToListAsync();
    }

    public override async Task<ModuleTask?> GetByIdAsync(int id)
    {
        return await _context.ModuleTasks
            .Include(t => t.Module)
            .FirstOrDefaultAsync(t => t.Id == id);
    }
}
