using Asp.Versioning;
using CustomerApi.Application.Common;
using CustomerApi.Domain.Entities;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/RoleMenu")]
public class RoleMenuController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? roleId = null,
        [FromQuery] int? menuId = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 200,
        CancellationToken ct = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var query = BuildQuery();
        if (roleId.HasValue) query = query.Where(x => x.rm.RoleId == roleId.Value);
        if (menuId.HasValue) query = query.Where(x => x.rm.MenuId == menuId.Value);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(x => x.RoleName)
            .ThenBy(x => x.SortOrder)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new RoleMenuEntryDto(
                x.rm.Id, x.rm.RoleId, x.RoleName, x.rm.MenuId, x.MenuCode, x.MenuName,
                x.rm.CanView, x.rm.CanAdd, x.rm.CanEdit, x.rm.CanDelete))
            .ToListAsync(ct);

        return Ok(new PagedResult<RoleMenuEntryDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var item = await BuildQuery().FirstOrDefaultAsync(x => x.rm.Id == id, ct);
        return item is null ? NotFound() : Ok(ToDto(item));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoleMenuRequest request, CancellationToken ct)
    {
        if (!await db.Roles.AnyAsync(r => r.Id == request.RoleId, ct)) return BadRequest("Role not found.");
        if (!await db.Menus.AnyAsync(m => m.Id == request.MenuId, ct)) return BadRequest("Menu not found.");

        var entity = new RoleMenu
        {
            RoleId = request.RoleId,
            MenuId = request.MenuId,
            CanView = request.CanView,
            CanAdd = request.CanAdd,
            CanEdit = request.CanEdit,
            CanDelete = request.CanDelete,
            CreatedBy = request.CreatedBy,
            ModifiedBy = request.CreatedBy,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow
        };

        db.RoleMenus.Add(entity);
        await db.SaveChangesAsync(ct);
        var dto = await BuildQuery().FirstAsync(x => x.rm.Id == entity.Id, ct);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, ToDto(dto));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRoleMenuRequest request, CancellationToken ct)
    {
        var entity = await db.RoleMenus.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return NotFound();

        entity.RoleId = request.RoleId;
        entity.MenuId = request.MenuId;
        entity.CanView = request.CanView;
        entity.CanAdd = request.CanAdd;
        entity.CanEdit = request.CanEdit;
        entity.CanDelete = request.CanDelete;
        entity.ModifiedBy = request.ModifiedBy;
        entity.ModifiedDate = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var dto = await BuildQuery().FirstAsync(x => x.rm.Id == id, ct);
        return Ok(ToDto(dto));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await db.RoleMenus.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return NotFound();

        db.RoleMenus.Remove(entity);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private IQueryable<RoleMenuRow> BuildQuery() =>
        from rm in db.RoleMenus.AsNoTracking()
        join r in db.Roles.AsNoTracking() on rm.RoleId equals r.Id
        join m in db.Menus.AsNoTracking() on rm.MenuId equals m.Id
        select new RoleMenuRow
        {
            rm = rm,
            RoleName = r.Name ?? string.Empty,
            MenuCode = m.MenuCode,
            MenuName = m.MenuName,
            SortOrder = m.SortOrder
        };

    private static RoleMenuEntryDto ToDto(RoleMenuRow row) =>
        new(row.rm.Id, row.rm.RoleId, row.RoleName, row.rm.MenuId, row.MenuCode, row.MenuName,
            row.rm.CanView, row.rm.CanAdd, row.rm.CanEdit, row.rm.CanDelete);

    private sealed class RoleMenuRow
    {
        public RoleMenu rm = null!;
        public string RoleName = string.Empty;
        public string MenuCode = string.Empty;
        public string MenuName = string.Empty;
        public int SortOrder;
    }
}
