using Asp.Versioning;
using CustomerApi.Application.Common;
using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Application.Features.Metas;
using CustomerApi.Application.Features.Metas.DTOs;
using CustomerApi.Domain.Entities;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/Metas")]
public class MetasController(
    ApplicationDbContext db,
    IGenericRepository<Meta> repository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<MetaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? metaTypeId = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var query = db.Metas.AsNoTracking();
        if (metaTypeId.HasValue)
            query = query.Where(x => x.MetaTypeId == metaTypeId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.Name.Contains(term));
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(x => x.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return Ok(new PagedResult<MetaDto>
        {
            Items = items.Select(MetaMapper.ToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
        });
    }

    [HttpGet("by-type-code/{metaTypeCode}")]
    [ProducesResponseType(typeof(PagedResult<MetaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByMetaTypeCode(
        string metaTypeCode,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 200,
        CancellationToken ct = default)
    {
        var code = metaTypeCode.Trim().ToUpperInvariant();
        var metaType = await db.MetaTypes.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code, ct);
        if (metaType is null)
            return NotFound(new { message = $"Meta type '{metaTypeCode}' was not found." });

        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var query = db.Metas.AsNoTracking().Where(x => x.MetaTypeId == metaType.Id);
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(x => x.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return Ok(new PagedResult<MetaDto>
        {
            Items = items.Select(MetaMapper.ToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
        });
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(MetaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var entity = await db.Metas.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return entity is null ? NotFound() : Ok(MetaMapper.ToDto(entity));
    }

    [HttpPost]
    [ProducesResponseType(typeof(MetaDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateMetaRequest request, CancellationToken ct)
    {
        Meta entity;
        try
        {
            entity = MetaMapper.ToEntity(request);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        entity.CreatedDate = DateTime.UtcNow;
        entity.ModifiedDate = DateTime.UtcNow;
        var created = await repository.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MetaMapper.ToDto(created));
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(MetaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMetaRequest request, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(id, ct);
        if (entity is null)
            return NotFound();

        MetaMapper.ApplyUpdate(entity, request);
        entity.ModifiedDate = DateTime.UtcNow;
        var updated = await repository.UpdateAsync(entity, ct);
        return Ok(MetaMapper.ToDto(updated));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await repository.DeleteByIdAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}
