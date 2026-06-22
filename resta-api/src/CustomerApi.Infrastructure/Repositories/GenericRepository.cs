using CustomerApi.Application.Common;
using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.Infrastructure.Repositories;

public class GenericRepository<T>(ApplicationDbContext context) : IGenericRepository<T> where T : class
{
    private readonly DbSet<T> _dbSet = context.Set<T>();

    public bool HasIntegerId => EntityIdHelper.HasIntegerId(typeof(T));

    public async Task<T?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        if (!HasIntegerId)
            return null;

        return await _dbSet.FindAsync([id], ct);
    }

    public async Task<PagedResult<T>> GetAllAsync(int pageNumber, int pageSize, CancellationToken ct = default)
    {
        var query = _dbSet.AsNoTracking();
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<T>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await _dbSet.AddAsync(entity, ct);
        await context.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<T> UpdateAsync(T entity, CancellationToken ct = default)
    {
        if (HasIntegerId)
        {
            var id = EntityIdHelper.GetIdValue(entity);
            var existing = await _dbSet.FindAsync([id], ct);
            if (existing is not null)
            {
                context.Entry(existing).CurrentValues.SetValues(entity);
                await context.SaveChangesAsync(ct);
                return existing;
            }
        }

        _dbSet.Update(entity);
        await context.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<bool> DeleteByIdAsync(int id, CancellationToken ct = default)
    {
        var entity = await GetByIdAsync(id, ct);
        if (entity is null)
            return false;

        _dbSet.Remove(entity);
        await context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(T entity, CancellationToken ct = default)
    {
        var tracked = await _dbSet.FirstOrDefaultAsync(e => e == entity, ct);
        if (tracked is null)
            return false;

        _dbSet.Remove(tracked);
        await context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken ct = default)
    {
        if (!HasIntegerId)
            return false;

        return await _dbSet.AnyAsync(e => EF.Property<int>(e, "Id") == id, ct);
    }
}
