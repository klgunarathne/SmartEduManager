using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class StudentRepository : Repository<Student>, IStudentRepository
{
    private readonly new AppDbContext _context;

    public StudentRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Student>> GetStudentsWithBatchAndCourseAsync()
    {
        return await _context.Students
            .Include(s => s.Batch)
            .ThenInclude(b => b.Course)
            .ToListAsync();
    }

    public async Task<Student?> GetStudentWithBatchAndCourseAsync(int id)
    {
        return await _context.Students
            .Include(s => s.Batch)
            .ThenInclude(b => b.Course)
            .FirstOrDefaultAsync(s => s.StudentId == id);
    }

    public async Task DeleteStudentWithRelationsAsync(int id)
    {
        var student = await _context.Students
            .Include(s => s.Batch)
            .FirstOrDefaultAsync(s => s.StudentId == id);

        if (student == null) return;

        var continuousAssessments = await _context.ContinuousAssessments
            .Where(ca => ca.StudentId == id)
            .ToListAsync();
        _context.ContinuousAssessments.RemoveRange(continuousAssessments);

        var assignmentMarks = await _context.AssignmentMarks
            .Where(am => am.StudentId == id)
            .ToListAsync();
        _context.AssignmentMarks.RemoveRange(assignmentMarks);

        _context.Students.Remove(student);
        await _context.SaveChangesAsync();
    }
}
