using Asp.Versioning;
using CustomerApi.API.Controllers.Base;
using CustomerApi.Application.Common;
using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Domain.Entities;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/Sale")]
public class SaleController(
    IGenericRepository<Sale> repository,
    ApplicationDbContext context)
    : CrudControllerBase<Sale>(repository)
{
    /// <summary>
    /// Server-side filtered search for sales.
    /// Supports filtering by referenceNo (contains), customerId, dateFrom and dateTo.
    /// Results are always ordered by Id descending (newest first).
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? referenceNo = null,
        [FromQuery] int? customerId = null,
        [FromQuery] string? dateFrom = null,
        [FromQuery] string? dateTo = null,
        CancellationToken ct = default)
    {
        var query = context.Set<Sale>().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(referenceNo))
            query = query.Where(s => s.ReferenceNo.Contains(referenceNo.Trim()));

        if (customerId is > 0)
            query = query.Where(s => s.CustomerId == customerId.Value);

        if (!string.IsNullOrWhiteSpace(dateFrom) && DateTime.TryParse(dateFrom, out var from))
            query = query.Where(s => s.CreatedDate >= from.Date);

        if (!string.IsNullOrWhiteSpace(dateTo) && DateTime.TryParse(dateTo, out var to))
            query = query.Where(s => s.CreatedDate < to.Date.AddDays(1));

        query = query.OrderByDescending(s => s.Id);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return Ok(new PagedResult<Sale>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
        });
    }
}
