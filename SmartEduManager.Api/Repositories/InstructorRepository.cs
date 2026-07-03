using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class InstructorRepository : Repository<Instructor>, IInstructorRepository
{
    public InstructorRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Instructor>> GetInstructorsWithCoursesAsync()
    {
        return await _context.Instructors
            .Include(i => i.CourseInstructors)
            .ThenInclude(ci => ci.Course.Center)
            .ToListAsync();
    }

    public async Task<Instructor?> GetInstructorWithCoursesAsync(int id)
    {
        return await _context.Instructors
            .Include(i => i.CourseInstructors)
            .ThenInclude(ci => ci.Course.Center)
            .FirstOrDefaultAsync(i => i.InstructorId == id);
    }
}
