using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface IAssignmentMarksRepository : IRepository<AssignmentMarks>
{
    Task<IEnumerable<AssignmentMarks>> GetAssignmentMarksByAssignmentAsync(int assignmentId);
    Task<IEnumerable<AssignmentMarks>> GetAssignmentMarksByStudentAsync(int studentId);
    Task<AssignmentMarks?> GetAssignmentMarksByAssignmentAndStudentAsync(int assignmentId, int studentId);
}
