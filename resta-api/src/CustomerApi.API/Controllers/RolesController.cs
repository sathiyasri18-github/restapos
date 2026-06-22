using Asp.Versioning;
using CustomerApi.Application.Common;
using CustomerApi.Domain.Entities;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/Roles")]
public class RolesController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var query = db.Roles.AsNoTracking();
        if (isActive.HasValue) query = query.Where(r => r.IsActive == isActive.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(r =>
                (r.Name != null && r.Name.Contains(term)) ||
                (r.Description != null && r.Description.Contains(term)));
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(r => r.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => AdminMapper.ToRoleDto(r))
            .ToListAsync(ct);

        return Ok(new PagedResult<RoleDto>
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
        var role = await db.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);
        return role is null ? NotFound() : Ok(AdminMapper.ToRoleDto(role));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RoleName))
            return BadRequest("Role name is required.");

        var role = new Role
        {
            Name = request.RoleName.Trim(),
            NormalizedName = request.RoleName.Trim().ToUpperInvariant(),
            Description = request.Description?.Trim(),
            IsActive = request.IsActive,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow
        };

        db.Roles.Add(role);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = role.Id }, AdminMapper.ToRoleDto(role));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRoleRequest request, CancellationToken ct)
    {
        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (role is null) return NotFound();

        role.Name = request.RoleName.Trim();
        role.NormalizedName = request.RoleName.Trim().ToUpperInvariant();
        role.Description = request.Description?.Trim();
        role.IsActive = request.IsActive;
        role.ModifiedDate = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(AdminMapper.ToRoleDto(role));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var role = await db.Roles.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (role is null) return NotFound();

        db.Roles.Remove(role);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("{id:int}/menus")]
    public async Task<IActionResult> GetMenus(int id, CancellationToken ct)
    {
        if (!await db.Roles.AnyAsync(r => r.Id == id, ct))
            return NotFound();

        var assigned = await db.RoleMenus.AsNoTracking()
            .Where(x => x.RoleId == id)
            .ToDictionaryAsync(x => x.MenuId, ct);

        var menus = await db.Menus.AsNoTracking()
            .Where(m => m.IsActive)
            .OrderBy(m => m.SortOrder)
            .ThenBy(m => m.MenuName)
            .ToListAsync(ct);

        var result = menus.Select(m =>
        {
            assigned.TryGetValue(m.Id, out var rm);
            return new RoleMenuPermissionDto(
                m.Id, m.MenuCode, m.MenuName,
                rm?.CanView ?? false,
                rm?.CanAdd ?? false,
                rm?.CanEdit ?? false,
                rm?.CanDelete ?? false);
        }).ToList();

        return Ok(result);
    }

    [HttpPut("{id:int}/menus")]
    public async Task<IActionResult> SetMenus(int id, [FromBody] SetRoleMenusRequest request, CancellationToken ct)
    {
        if (!await db.Roles.AnyAsync(r => r.Id == id, ct))
            return NotFound();

        var existing = await db.RoleMenus.Where(x => x.RoleId == id).ToListAsync(ct);
        db.RoleMenus.RemoveRange(existing);

        foreach (var item in request.Menus.Where(m => m.MenuId > 0))
        {
            db.RoleMenus.Add(new RoleMenu
            {
                RoleId = id,
                MenuId = item.MenuId,
                CanView = item.CanView,
                CanAdd = item.CanAdd,
                CanEdit = item.CanEdit,
                CanDelete = item.CanDelete,
                CreatedBy = request.ModifiedBy,
                ModifiedBy = request.ModifiedBy,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync(ct);
        return await GetMenus(id, ct);
    }
}
