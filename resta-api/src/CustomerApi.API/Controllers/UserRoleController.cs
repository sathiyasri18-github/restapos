using Asp.Versioning;
using CustomerApi.Application.Common;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/UserRole")]
public class UserRoleController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? userId = null,
        [FromQuery] int? roleId = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 200,
        CancellationToken ct = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var query =
            from ur in db.UserRoles.AsNoTracking()
            join u in db.Users.AsNoTracking() on ur.UserId equals u.Id
            join r in db.Roles.AsNoTracking() on ur.RoleId equals r.Id
            where !u.IsDeleted
            select new { ur, u, r };

        if (userId.HasValue) query = query.Where(x => x.ur.UserId == userId.Value);
        if (roleId.HasValue) query = query.Where(x => x.ur.RoleId == roleId.Value);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(x => x.u.UserName)
            .ThenBy(x => x.r.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserRoleDto(
                x.u.Id,
                x.u.UserName ?? string.Empty,
                AdminMapper.DisplayName(x.u),
                x.r.Id,
                x.r.Name ?? string.Empty))
            .ToListAsync(ct);

        return Ok(new PagedResult<UserRoleDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetByUser(int userId, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, ct);
        if (user is null) return NotFound();

        var roleIds = await db.UserRoles.AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.RoleId)
            .ToListAsync(ct);

        if (roleIds.Count == 0 && user.RoleId > 0)
            roleIds = [user.RoleId];

        return Ok(new { userId, roleIds });
    }

    [HttpPut("assign")]
    public async Task<IActionResult> Assign([FromBody] AssignUserRolesRequest request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId && !u.IsDeleted, ct);
        if (user is null) return NotFound();

        var roleIds = request.RoleIds.Where(id => id > 0).Distinct().ToList();
        var existing = await db.UserRoles.Where(x => x.UserId == request.UserId).ToListAsync(ct);
        db.UserRoles.RemoveRange(existing);

        foreach (var roleId in roleIds)
        {
            db.UserRoles.Add(new Domain.Entities.UserRole
            {
                UserId = request.UserId,
                RoleId = roleId,
                CreatedBy = request.ModifiedBy,
                CreatedDate = DateTime.UtcNow
            });
        }

        if (roleIds.Count > 0) user.RoleId = roleIds[0];
        user.ModifiedDate = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(new { request.UserId, roleIds });
    }

    [HttpDelete]
    public async Task<IActionResult> Remove([FromQuery] int userId, [FromQuery] int roleId, CancellationToken ct)
    {
        var row = await db.UserRoles.FirstOrDefaultAsync(x => x.UserId == userId && x.RoleId == roleId, ct);
        if (row is null) return NotFound();

        db.UserRoles.Remove(row);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
