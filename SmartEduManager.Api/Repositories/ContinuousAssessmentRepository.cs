using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class ContinuousAssessmentRepository : Repository<ContinuousAssessment>, IContinuousAssessmentRepository
{
    private readonly AppDbContext _context;

    public ContinuousAssessmentRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ContinuousAssessment>> GetAssessmentsByStudentAsync(int studentId)
    {
        return await _context.ContinuousAssessments
            .Where(ca => ca.StudentId == studentId)
            .Include(ca => ca.ModuleTask)
            .ThenInclude(mt => mt.Module)
            .ToListAsync();
    }

    public async Task<IEnumerable<ContinuousAssessment>> GetAssessmentsByModuleTaskAsync(int moduleTaskId)
    {
        return await _context.ContinuousAssessments
            .Where(ca => ca.ModuleTaskId == moduleTaskId)
            .Include(ca => ca.Student)
            .ToListAsync();
    }

    public async Task<ContinuousAssessment?> GetAssessmentByStudentAndTaskAsync(int studentId, int moduleTaskId)
    {
        return await _context.ContinuousAssessments
            .FirstOrDefaultAsync(ca => ca.StudentId == studentId && ca.ModuleTaskId == moduleTaskId);
    }

    public async Task<IEnumerable<ContinuousAssessment>> GetAssessmentsByBatchAsync(int batchId)
    {
        return await _context.ContinuousAssessments
            .Where(ca => ca.Student.BatchId == batchId)
            .Include(ca => ca.Student)
            .Include(ca => ca.ModuleTask)
            .ThenInclude(mt => mt.Module)
            .ToListAsync();
    }

    public async Task<IEnumerable<ContinuousAssessment>> GetAssessmentsByCourseAsync(int courseId)
    {
        return await _context.ContinuousAssessments
            .Where(ca => ca.Student.Batch.CourseId == courseId)
            .Include(ca => ca.Student)
            .Include(ca => ca.ModuleTask)
            .ThenInclude(mt => mt.Module)
            .ToListAsync();
    }
}
