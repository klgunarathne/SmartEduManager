using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface IInstructorRepository : IRepository<Instructor>
{
    Task<IEnumerable<Instructor>> GetInstructorsWithCoursesAsync();
    Task<Instructor?> GetInstructorWithCoursesAsync(int id);
}
