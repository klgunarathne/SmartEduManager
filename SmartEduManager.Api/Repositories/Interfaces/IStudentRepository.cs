using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface IStudentRepository : IRepository<Student>
{
    Task<IEnumerable<Student>> GetStudentsWithBatchAndCourseAsync();
    Task DeleteStudentWithRelationsAsync(int id);
}
