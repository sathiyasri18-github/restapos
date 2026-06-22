using Asp.Versioning;
using CustomerApi.Application.Common;
using CustomerApi.Domain.Entities;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/User")]
public class UserController(
    ApplicationDbContext db,
    UserManager<User> userManager) : ControllerBase
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

        var query = db.Users.AsNoTracking().Where(u => !u.IsDeleted);
        if (isActive.HasValue) query = query.Where(u => u.IsActive == isActive.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(u =>
                (u.UserName != null && u.UserName.Contains(term)) ||
                (u.Email != null && u.Email.Contains(term)) ||
                (u.CompanyName != null && u.CompanyName.Contains(term)));
        }

        var totalCount = await query.CountAsync(ct);
        var users = await query
            .OrderBy(u => u.UserName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var userIds = users.Select(u => u.Id).ToList();
        var roleMap = await LoadUserRoleMapAsync(userIds, ct);
        var items = users.Select(u =>
        {
            var (roleIds, roleNames) = roleMap.GetValueOrDefault(u.Id, ([u.RoleId], []));
            return AdminMapper.ToUserDto(u, roleIds, roleNames);
        }).ToList();

        return Ok(new PagedResult<UserDto>
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
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
        if (user is null) return NotFound();
        var (roleIds, roleNames) = await LoadUserRolesAsync(id, user.RoleId, ct);
        return Ok(AdminMapper.ToUserDto(user, roleIds, roleNames));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.UserName))
            return BadRequest("User name is required.");
        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Password is required.");

        if (await userManager.FindByNameAsync(request.UserName.Trim()) is not null)
            return BadRequest($"Username '{request.UserName}' is already taken.");

        var roleIds = NormalizeRoleIds(request.RoleIds);
        var user = new User
        {
            UserName = request.UserName.Trim(),
            Email = request.Email?.Trim() ?? string.Empty,
            CompanyName = request.DisplayName?.Trim(),
            RoleId = roleIds.FirstOrDefault(),
            IsActive = request.IsActive,
            IsDeleted = false,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(string.Join("; ", result.Errors.Select(e => e.Description)));

        await SyncUserRolesAsync(user.Id, roleIds, request.CreatedBy, ct);
        var (ids, names) = await LoadUserRolesAsync(user.Id, user.RoleId, ct);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, AdminMapper.ToUserDto(user, ids, names));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
        if (user is null) return NotFound();

        var userName = request.UserName.Trim();
        if (await db.Users.AnyAsync(u => u.Id != id && u.UserName == userName && !u.IsDeleted, ct))
            return BadRequest($"Username '{userName}' is already taken.");

        user.UserName = userName;
        user.Email = request.Email?.Trim() ?? string.Empty;
        user.CompanyName = request.DisplayName?.Trim();
        user.IsActive = request.IsActive;
        user.ModifiedDate = DateTime.UtcNow;

        var roleIds = NormalizeRoleIds(request.RoleIds);
        if (roleIds.Count > 0) user.RoleId = roleIds[0];

        if (!string.IsNullOrWhiteSpace(request.Password))
            user.PasswordHash = userManager.PasswordHasher.HashPassword(user, request.Password);

        await db.SaveChangesAsync(ct);
        await SyncUserRolesAsync(id, roleIds, request.ModifiedBy, ct);

        var (ids, names) = await LoadUserRolesAsync(id, user.RoleId, ct);
        return Ok(AdminMapper.ToUserDto(user, ids, names));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
        if (user is null) return NotFound();

        user.IsDeleted = true;
        user.IsActive = false;
        user.ModifiedDate = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static List<int> NormalizeRoleIds(IReadOnlyList<int>? roleIds) =>
        roleIds?.Where(id => id > 0).Distinct().ToList() ?? [];

    private async Task SyncUserRolesAsync(int userId, IReadOnlyList<int> roleIds, int? actorId, CancellationToken ct)
    {
        var existing = await db.UserRoles.Where(x => x.UserId == userId).ToListAsync(ct);
        db.UserRoles.RemoveRange(existing);

        foreach (var roleId in roleIds)
        {
            db.UserRoles.Add(new UserRole
            {
                UserId = userId,
                RoleId = roleId,
                CreatedBy = actorId,
                CreatedDate = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task<(IReadOnlyList<int> RoleIds, IReadOnlyList<string> RoleNames)> LoadUserRolesAsync(
        int userId, int fallbackRoleId, CancellationToken ct)
    {
        var rows = await (
            from ur in db.UserRoles.AsNoTracking()
            join r in db.Roles.AsNoTracking() on ur.RoleId equals r.Id
            where ur.UserId == userId
            orderby r.Name
            select new { ur.RoleId, RoleName = r.Name ?? string.Empty }
        ).ToListAsync(ct);

        if (rows.Count == 0 && fallbackRoleId > 0)
        {
            var name = await db.Roles.AsNoTracking()
                .Where(r => r.Id == fallbackRoleId)
                .Select(r => r.Name ?? string.Empty)
                .FirstOrDefaultAsync(ct) ?? string.Empty;
            return ([fallbackRoleId], [name]);
        }

        return (rows.Select(x => x.RoleId).ToList(), rows.Select(x => x.RoleName).ToList());
    }

    private async Task<Dictionary<int, (IReadOnlyList<int> RoleIds, IReadOnlyList<string> RoleNames)>> LoadUserRoleMapAsync(
        IReadOnlyList<int> userIds, CancellationToken ct)
    {
        if (userIds.Count == 0) return [];

        var rows = await (
            from ur in db.UserRoles.AsNoTracking()
            join r in db.Roles.AsNoTracking() on ur.RoleId equals r.Id
            where userIds.Contains(ur.UserId)
            orderby r.Name
            select new { ur.UserId, ur.RoleId, RoleName = r.Name ?? string.Empty }
        ).ToListAsync(ct);

        return rows
            .GroupBy(x => x.UserId)
            .ToDictionary(
                g => g.Key,
                g => ((IReadOnlyList<int>)g.Select(x => x.RoleId).ToList(),
                    (IReadOnlyList<string>)g.Select(x => x.RoleName).ToList()));
    }
}
