using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class InstructorRepository : Repository<Instructor>, IInstructorRepository
{
    public InstructorRepository(AppDbContext context) : base(context)
    {
    }
}
