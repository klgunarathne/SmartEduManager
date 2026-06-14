using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class ExamRepository : Repository<Exam>, IExamRepository
{
    public ExamRepository(AppDbContext context) : base(context)
    {
    }
}