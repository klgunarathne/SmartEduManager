using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class CenterRepository : Repository<Center>, ICenterRepository
{
    public CenterRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Center>> GetCentersWithDistrictAsync()
    {
        return await _context.Centers.Include(c => c.District).ToListAsync();
    }
}
