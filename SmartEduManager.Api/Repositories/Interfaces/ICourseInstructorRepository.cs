using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface ICourseInstructorRepository : IRepository<CourseInstructor>
{
    Task<IEnumerable<CourseInstructor>> GetCourseInstructorsWithDetailsAsync();
}
