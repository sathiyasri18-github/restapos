using Asp.Versioning;
using CustomerApi.Application.Common;
using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Application.Features.MetaTypes;
using CustomerApi.Application.Features.MetaTypes.DTOs;
using CustomerApi.Domain.Entities;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/MetaTypes")]
public class MetaTypesController(
    ApplicationDbContext db,
    IGenericRepository<MetaType> repository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<MetaTypeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var query = db.MetaTypes.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.Name.Contains(term) || x.Code.Contains(term));
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(x => x.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return Ok(new PagedResult<MetaTypeDto>
        {
            Items = items.Select(MetaTypeMapper.ToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
        });
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(MetaTypeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var entity = await db.MetaTypes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return entity is null ? NotFound() : Ok(MetaTypeMapper.ToDto(entity));
    }

    [HttpPost]
    [ProducesResponseType(typeof(MetaTypeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateMetaTypeRequest request, CancellationToken ct)
    {
        MetaType entity;
        try
        {
            entity = MetaTypeMapper.ToEntity(request);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        entity.CreatedDate = DateTime.UtcNow;
        entity.ModifiedDate = DateTime.UtcNow;
        var created = await repository.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MetaTypeMapper.ToDto(created));
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(MetaTypeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMetaTypeRequest request, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(id, ct);
        if (entity is null)
            return NotFound();

        MetaTypeMapper.ApplyUpdate(entity, request);
        entity.ModifiedDate = DateTime.UtcNow;
        var updated = await repository.UpdateAsync(entity, ct);
        return Ok(MetaTypeMapper.ToDto(updated));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var hasMetas = await db.Metas.AnyAsync(x => x.MetaTypeId == id, ct);
        if (hasMetas)
            return BadRequest(new { message = "Cannot delete meta type that has meta values." });

        var deleted = await repository.DeleteByIdAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}
