using Asp.Versioning;
using CustomerApi.Application.Common;
using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Domain.Entities;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.API.Controllers;

public record MenuDto(
    int Id,
    int? ParentMenuId,
    string MenuCode,
    string MenuName,
    string? RoutePath,
    string? Icon,
    int SortOrder,
    bool IsActive,
    string? ParentMenuName);

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/Menu")]
public class MenuController(ApplicationDbContext db, ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 500,
        CancellationToken ct = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var menus = await db.Menus.AsNoTracking()
            .OrderBy(m => m.SortOrder)
            .ThenBy(m => m.MenuName)
            .ToListAsync(ct);

        var parentNames = menus.ToDictionary(m => m.Id, m => m.MenuName);
        var totalCount = menus.Count;
        var items = menus
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(m => ToDto(m, m.ParentMenuId.HasValue ? parentNames.GetValueOrDefault(m.ParentMenuId.Value) : null))
            .ToList();

        return Ok(new PagedResult<MenuDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    [HttpGet("tree")]
    public async Task<IActionResult> GetTree(CancellationToken ct)
    {
        var menus = await LoadActiveMenusAsync(ct);
        var lookup = menus.ToLookup(m => m.ParentMenuId);
        return Ok(BuildTree(lookup, null));
    }

    /// <summary>Menu tree filtered by the current user's role menu permissions (CanView).</summary>
    [HttpGet("tree/me")]
    [Authorize]
    public async Task<IActionResult> GetMyTree(CancellationToken ct)
    {
        if (currentUser.UserId is not int userId)
            return Unauthorized();

        var menus = await LoadActiveMenusAsync(ct);
        var roleIds = await GetUserRoleIdsAsync(userId, ct);
        if (roleIds.Count == 0)
            return Ok(Array.Empty<MenuTreeItemDto>());

        var isAdmin = await db.Roles.AsNoTracking()
            .AnyAsync(r => roleIds.Contains(r.Id) && r.Name != null && r.Name.ToLower() == "admin", ct);

        if (isAdmin)
        {
            var lookup = menus.ToLookup(m => m.ParentMenuId);
            return Ok(BuildTree(lookup, null));
        }

        var allowedMenuIds = await db.RoleMenus.AsNoTracking()
            .Where(rm => roleIds.Contains(rm.RoleId) && rm.CanView)
            .Select(rm => rm.MenuId)
            .Distinct()
            .ToListAsync(ct);

        return Ok(BuildPermissionTree(menus, allowedMenuIds.ToHashSet()));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var menu = await db.Menus.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id, ct);
        if (menu is null) return NotFound();

        string? parentName = null;
        if (menu.ParentMenuId.HasValue)
        {
            parentName = await db.Menus.AsNoTracking()
                .Where(m => m.Id == menu.ParentMenuId.Value)
                .Select(m => m.MenuName)
                .FirstOrDefaultAsync(ct);
        }

        return Ok(ToDto(menu, parentName));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Menu entity, CancellationToken ct)
    {
        entity.CreatedDate = DateTime.UtcNow;
        entity.ModifiedDate = DateTime.UtcNow;
        db.Menus.Add(entity);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, ToDto(entity, null));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Menu entity, CancellationToken ct)
    {
        var existing = await db.Menus.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (existing is null) return NotFound();

        existing.ParentMenuId = entity.ParentMenuId;
        existing.MenuCode = entity.MenuCode;
        existing.MenuName = entity.MenuName;
        existing.RoutePath = entity.RoutePath;
        existing.Icon = entity.Icon;
        existing.SortOrder = entity.SortOrder;
        existing.IsActive = entity.IsActive;
        existing.ModifiedBy = entity.ModifiedBy;
        existing.ModifiedDate = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        string? parentName = null;
        if (existing.ParentMenuId.HasValue)
        {
            parentName = await db.Menus.AsNoTracking()
                .Where(m => m.Id == existing.ParentMenuId.Value)
                .Select(m => m.MenuName)
                .FirstOrDefaultAsync(ct);
        }

        return Ok(ToDto(existing, parentName));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var menu = await db.Menus.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (menu is null) return NotFound();

        db.Menus.Remove(menu);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<List<Menu>> LoadActiveMenusAsync(CancellationToken ct) =>
        await db.Menus.AsNoTracking()
            .Where(m => m.IsActive)
            .OrderBy(m => m.SortOrder)
            .ThenBy(m => m.MenuName)
            .ToListAsync(ct);

    private async Task<List<int>> GetUserRoleIdsAsync(int userId, CancellationToken ct)
    {
        var roleIds = await db.UserRoles.AsNoTracking()
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync(ct);

        var primaryRoleId = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId && !u.IsDeleted)
            .Select(u => u.RoleId)
            .FirstOrDefaultAsync(ct);

        if (primaryRoleId > 0 && !roleIds.Contains(primaryRoleId))
            roleIds.Add(primaryRoleId);

        return roleIds.Distinct().ToList();
    }

    private static List<MenuTreeItemDto> BuildPermissionTree(IReadOnlyList<Menu> menus, HashSet<int> allowedMenuIds) =>
        BuildPermissionTree(menus.ToLookup(m => m.ParentMenuId), null, allowedMenuIds);

    private static List<MenuTreeItemDto> BuildPermissionTree(
        ILookup<int?, Menu> lookup,
        int? parentId,
        HashSet<int> allowedMenuIds)
    {
        var result = new List<MenuTreeItemDto>();

        foreach (var menu in lookup[parentId])
        {
            var children = BuildPermissionTree(lookup, menu.Id, allowedMenuIds);
            if (children.Count > 0)
            {
                result.Add(new MenuTreeItemDto(
                    menu.Id, menu.ParentMenuId, menu.MenuCode, menu.MenuName,
                    menu.RoutePath, menu.Icon, menu.SortOrder, children));
            }
            else if (allowedMenuIds.Contains(menu.Id))
            {
                result.Add(new MenuTreeItemDto(
                    menu.Id, menu.ParentMenuId, menu.MenuCode, menu.MenuName,
                    menu.RoutePath, menu.Icon, menu.SortOrder, []));
            }
        }

        return result;
    }

    private static MenuDto ToDto(Menu menu, string? parentMenuName) =>
        new(menu.Id, menu.ParentMenuId, menu.MenuCode, menu.MenuName,
            menu.RoutePath, menu.Icon, menu.SortOrder, menu.IsActive, parentMenuName);

    private static List<MenuTreeItemDto> BuildTree(ILookup<int?, Menu> lookup, int? parentId) =>
        lookup[parentId]
            .Select(m => new MenuTreeItemDto(
                m.Id, m.ParentMenuId, m.MenuCode, m.MenuName,
                m.RoutePath, m.Icon, m.SortOrder,
                BuildTree(lookup, m.Id)))
            .ToList();
}
