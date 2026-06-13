using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface INCSRepository : IRepository<NCS>
{
    Task<IEnumerable<NCS>> GetNCSWithModulesAsync();
    Task<NCS?> GetNCSWithCourseAndModulesAsync(int id);
    Task<IEnumerable<NCS>> GetNCSByCourseIdAsync(int courseId);
}
