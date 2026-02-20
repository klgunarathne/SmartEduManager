using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class AssignmentMarksRepository : Repository<AssignmentMarks>, IAssignmentMarksRepository
{
    private readonly AppDbContext _context;

    public AssignmentMarksRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AssignmentMarks>> GetAssignmentMarksByAssignmentAsync(int assignmentId)
    {
        return await _context.AssignmentMarks
            .Where(am => am.AssignmentId == assignmentId)
            .Include(am => am.Student)
            .ToListAsync();
    }

    public async Task<IEnumerable<AssignmentMarks>> GetAssignmentMarksByStudentAsync(int studentId)
    {
        return await _context.AssignmentMarks
            .Where(am => am.StudentId == studentId)
            .Include(am => am.Assignment)
            .ToListAsync();
    }

    public async Task<AssignmentMarks?> GetAssignmentMarksByAssignmentAndStudentAsync(int assignmentId, int studentId)
    {
        return await _context.AssignmentMarks
            .FirstOrDefaultAsync(am => am.AssignmentId == assignmentId && am.StudentId == studentId);
    }
}
