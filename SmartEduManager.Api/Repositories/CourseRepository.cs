using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class CourseRepository : Repository<Course>, ICourseRepository
{
    public CourseRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Course>> GetCoursesWithCenterAsync()
    {
        return await _context.Courses.Include(c => c.Center).ToListAsync();
    }

public async Task<IEnumerable<Course>> GetCoursesWithAllDetailsAsync()
 {
     return await _context.Courses
         .Include(c => c.Center)
         .Include(c => c.CourseInstructors)
         .ThenInclude(ci => ci.Instructor)
         .Include(c => c.Batches)
         .Include(c => c.NCS)
         .ToListAsync();
 }

    public async Task<Course?> GetCourseWithAllDetailsAsync(int id)
    {
        return await _context.Courses
            .Include(c => c.Center)
            .Include(c => c.CourseInstructors)
            .ThenInclude(ci => ci.Instructor)
            .Include(c => c.Batches)
            .FirstOrDefaultAsync(c => c.CourseId == id);
    }
}
