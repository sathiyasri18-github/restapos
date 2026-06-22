using CustomerApi.Application.Common;

namespace CustomerApi.Application.Common.Interfaces;

public interface IGenericRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<PagedResult<T>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    Task<T> UpdateAsync(T entity, CancellationToken ct = default);
    Task<bool> DeleteByIdAsync(int id, CancellationToken ct = default);
    Task<bool> DeleteAsync(T entity, CancellationToken ct = default);
    Task<bool> ExistsAsync(int id, CancellationToken ct = default);
    bool HasIntegerId { get; }
}
