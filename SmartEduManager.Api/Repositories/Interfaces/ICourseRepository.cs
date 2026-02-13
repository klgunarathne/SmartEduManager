using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface ICourseRepository : IRepository<Course>
{
    Task<IEnumerable<Course>> GetCoursesWithCenterAsync();
    Task<IEnumerable<Course>> GetCoursesWithAllDetailsAsync();
    Task<Course?> GetCourseWithAllDetailsAsync(int id);
}
