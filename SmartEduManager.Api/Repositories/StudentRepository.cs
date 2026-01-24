using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class StudentRepository : Repository<Student>, IStudentRepository
{
    public StudentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Student>> GetStudentsWithBatchAndCourseAsync()
    {
        return await _context.Students
            .Include(s => s.Batch)
            .ThenInclude(b => b.Course)
            .ToListAsync();
    }
}
