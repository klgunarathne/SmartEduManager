using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface IModuleTaskRepository : IRepository<ModuleTask>
{
    Task<IEnumerable<ModuleTask>> GetModuleTasksByModuleIdAsync(int moduleId);
}
