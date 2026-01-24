using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface IDistrictRepository : IRepository<District>
{
    Task<IEnumerable<District>> GetDistrictsWithCentersAsync();
}
