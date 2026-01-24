using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Repositories.Interfaces;

namespace SmartEduManager.Api.Repositories;

public class DistrictRepository : Repository<District>, IDistrictRepository
{
    public DistrictRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<District>> GetDistrictsWithCentersAsync()
    {
        return await _context.Districts.Include(d => d.Centers).ToListAsync();
    }
}
