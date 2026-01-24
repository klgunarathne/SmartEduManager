using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class CourseInstructorRepository : Repository<CourseInstructor>, ICourseInstructorRepository
{
    public CourseInstructorRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<CourseInstructor>> GetCourseInstructorsWithDetailsAsync()
    {
        return await _context.CourseInstructors
            .Include(ci => ci.Course)
            .Include(ci => ci.Instructor)
            .ToListAsync();
    }
}
