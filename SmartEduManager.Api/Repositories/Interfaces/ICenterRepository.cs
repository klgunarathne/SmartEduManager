using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Repositories.Interfaces;

public interface ICenterRepository : IRepository<Center>
{
    Task<IEnumerable<Center>> GetCentersWithDistrictAsync();
    Task<Center?> GetCenterWithDistrictAsync(int id);
}
