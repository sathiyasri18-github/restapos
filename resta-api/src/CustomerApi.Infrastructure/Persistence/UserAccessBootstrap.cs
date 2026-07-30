using CustomerApi.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CustomerApi.Infrastructure.Persistence;

/// <summary>
/// Ensures IsApproved column, SuperAdmin role/user, and SuperAdmin menu access.
/// Safe to run on every startup (idempotent).
/// </summary>
public static class UserAccessBootstrap
{
    public const string SuperAdminRoleName = "SuperAdmin";
    public const string DefaultSignUpRoleName = "Customer";
    public const string SuperAdminUserName = "superadmin";

    public static async Task EnsureAsync(IServiceProvider services, CancellationToken ct = default)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<User>>();
        var configuration = services.GetRequiredService<IConfiguration>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("UserAccessBootstrap");

        await EnsureIsApprovedColumnAsync(db, logger, ct);
        await EnsureSuperAdminRoleAsync(db, logger, ct);
        await EnsureSuperAdminMenusAsync(db, logger, ct);
        await EnsureSuperAdminUserAsync(db, userManager, configuration, logger, ct);
        await BackfillApprovedExistingUsersAsync(db, logger, ct);
    }

    private static async Task EnsureIsApprovedColumnAsync(
        ApplicationDbContext db, ILogger logger, CancellationToken ct)
    {
        const string sql = """
            IF COL_LENGTH(N'dbo.[User]', N'IsApproved') IS NULL
            BEGIN
                ALTER TABLE [User] ADD [IsApproved] BIT NOT NULL
                    CONSTRAINT [DF_User_IsApproved] DEFAULT (1);
            END
            """;
        await db.Database.ExecuteSqlRawAsync(sql, ct);
        logger.LogInformation("Ensured [User].[IsApproved] column exists.");
    }

    private static async Task EnsureSuperAdminRoleAsync(
        ApplicationDbContext db, ILogger logger, CancellationToken ct)
    {
        var exists = await db.Roles.AnyAsync(
            r => r.Name != null && r.Name.ToLower() == SuperAdminRoleName.ToLower(), ct);
        if (exists) return;

        db.Roles.Add(new Role
        {
            Name = SuperAdminRoleName,
            NormalizedName = SuperAdminRoleName.ToUpperInvariant(),
            Description = "Full system access; approves signed-up users.",
            GuardName = "web",
            IsActive = true,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Created {Role} role.", SuperAdminRoleName);
    }

    private static async Task EnsureSuperAdminMenusAsync(
        ApplicationDbContext db, ILogger logger, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO [RoleMenu] ([RoleId],[MenuId],[CanView],[CanAdd],[CanEdit],[CanDelete],[CreatedDate],[ModifiedDate])
            SELECT r.[Id], m.[Id], 1, 1, 1, 1, GETDATE(), GETDATE()
            FROM [Role] r
            CROSS JOIN [Menu] m
            WHERE LOWER(r.[Name]) = LOWER(N'SuperAdmin')
              AND m.[IsActive] = 1
              AND NOT EXISTS (
                SELECT 1 FROM [RoleMenu] rm WHERE rm.[RoleId] = r.[Id] AND rm.[MenuId] = m.[Id]
              );
            """;
        var inserted = await db.Database.ExecuteSqlRawAsync(sql, ct);
        if (inserted > 0)
            logger.LogInformation("Granted SuperAdmin role access to {Count} menu item(s).", inserted);
    }

    private static async Task EnsureSuperAdminUserAsync(
        ApplicationDbContext db,
        UserManager<User> userManager,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken ct)
    {
        var role = await db.Roles.FirstAsync(
            r => r.Name != null && r.Name.ToLower() == SuperAdminRoleName.ToLower(), ct);

        var password = configuration["Seed:SuperAdminPassword"] ?? "SuperAdmin@123";
        var existing = await userManager.FindByNameAsync(SuperAdminUserName);
        if (existing is null)
        {
            var user = new User
            {
                UserName = SuperAdminUserName,
                Email = "superadmin@muruenterprises.info",
                PhoneNumber = string.Empty, // [User].[Phone] is NOT NULL
                CompanyName = "Super Admin",
                RoleId = role.Id,
                IsActive = true,
                IsApproved = true,
                IsDeleted = false,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                logger.LogError("Failed to create SuperAdmin user: {Errors}",
                    string.Join("; ", result.Errors.Select(e => e.Description)));
                return;
            }

            db.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id,
                CreatedDate = DateTime.UtcNow
            });
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Created SuperAdmin user '{User}'.", SuperAdminUserName);
            return;
        }

        existing.IsApproved = true;
        existing.IsActive = true;
        existing.IsDeleted = false;
        if (existing.RoleId != role.Id)
            existing.RoleId = role.Id;
        existing.ModifiedDate = DateTime.UtcNow;
        await userManager.UpdateAsync(existing);

        var hasLink = await db.UserRoles.AnyAsync(
            ur => ur.UserId == existing.Id && ur.RoleId == role.Id, ct);
        if (!hasLink)
        {
            db.UserRoles.Add(new UserRole
            {
                UserId = existing.Id,
                RoleId = role.Id,
                CreatedDate = DateTime.UtcNow
            });
            await db.SaveChangesAsync(ct);
        }
    }

    private static async Task BackfillApprovedExistingUsersAsync(
        ApplicationDbContext db, ILogger logger, CancellationToken ct)
    {
        // Existing rows get DEFAULT 1 from ALTER; nothing else required.
        // Keep method for future backfills.
        await Task.CompletedTask;
        logger.LogDebug("User approval backfill complete.");
    }
}
