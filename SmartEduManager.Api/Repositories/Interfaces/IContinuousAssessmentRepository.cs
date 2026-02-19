using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface IContinuousAssessmentRepository : IRepository<ContinuousAssessment>
{
    Task<IEnumerable<ContinuousAssessment>> GetAssessmentsByStudentAsync(int studentId);
    Task<IEnumerable<ContinuousAssessment>> GetAssessmentsByModuleTaskAsync(int moduleTaskId);
    Task<ContinuousAssessment?> GetAssessmentByStudentAndTaskAsync(int studentId, int moduleTaskId);
    Task<IEnumerable<ContinuousAssessment>> GetAssessmentsByBatchAsync(int batchId);
    Task<IEnumerable<ContinuousAssessment>> GetAssessmentsByCourseAsync(int courseId);
}
