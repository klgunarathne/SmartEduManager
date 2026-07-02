using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface IModulesRepository : IRepository<Models.Modules>
{
    Task<IEnumerable<Models.Modules>> GetModulesWithTasksAsync();
    Task<IEnumerable<Models.Modules>> GetModulesByNCSIdAsync(int ncsId);
    Task<IEnumerable<ModuleTask>> GetAllTasksAsync();
}
