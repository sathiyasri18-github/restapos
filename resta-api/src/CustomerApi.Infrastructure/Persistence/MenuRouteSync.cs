using CustomerApi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CustomerApi.Infrastructure.Persistence;

public static class MenuRouteSync
{
    public static async Task SyncAsync(ApplicationDbContext context, ILogger logger, CancellationToken ct = default)
    {
        var sql = BuildMergeSql();
        await context.Database.ExecuteSqlRawAsync(sql, ct);
        logger.LogInformation("Menu routes synced from app route definitions ({Count} entries).",
            MenuRouteDefinitions.All.Count);

        await EnsureAdminRoleMenusAsync(context, logger, ct);
    }

    private static string BuildMergeSql()
    {
        var values = MenuRouteDefinitions.All.Select(def =>
        {
            var parent = def.ParentMenuId?.ToString() ?? "NULL";
            var route = def.RoutePath == null ? "NULL" : $"N'{Escape(def.RoutePath)}'";
            return $"({def.Id}, {parent}, N'{Escape(def.MenuCode)}', N'{Escape(def.MenuName)}', {route}, N'{Escape(def.Icon)}', {def.SortOrder})";
        });

        var idList = string.Join(", ", MenuRouteDefinitions.AllIds.OrderBy(x => x));

        return $"""
            SET NOCOUNT ON;
            SET IDENTITY_INSERT [Menu] ON;

            MERGE [Menu] AS target
            USING (VALUES
                {string.Join(",\n                ", values)}
            ) AS source ([Id], [ParentMenuId], [MenuCode], [MenuName], [RoutePath], [Icon], [SortOrder])
            ON target.[Id] = source.[Id]
            WHEN MATCHED THEN UPDATE SET
                [ParentMenuId] = source.[ParentMenuId],
                [MenuCode] = source.[MenuCode],
                [MenuName] = source.[MenuName],
                [RoutePath] = source.[RoutePath],
                [Icon] = source.[Icon],
                [SortOrder] = source.[SortOrder],
                [IsActive] = 1,
                [ModifiedDate] = GETDATE()
            WHEN NOT MATCHED THEN INSERT
                ([Id], [ParentMenuId], [MenuCode], [MenuName], [RoutePath], [Icon], [SortOrder], [IsActive], [CreatedDate], [ModifiedDate])
            VALUES
                (source.[Id], source.[ParentMenuId], source.[MenuCode], source.[MenuName], source.[RoutePath], source.[Icon], source.[SortOrder], 1, GETDATE(), GETDATE());

            SET IDENTITY_INSERT [Menu] OFF;

            UPDATE [Menu]
            SET [IsActive] = 0, [ModifiedDate] = GETDATE()
            WHERE [Id] NOT IN ({idList}) AND [IsActive] = 1;
            """;
    }

    private static async Task EnsureAdminRoleMenusAsync(
        ApplicationDbContext context,
        ILogger logger,
        CancellationToken ct)
    {
        const string sql = """
            INSERT INTO [RoleMenu] ([RoleId],[MenuId],[CanView],[CanAdd],[CanEdit],[CanDelete],[CreatedDate],[ModifiedDate])
            SELECT r.[Id], m.[Id], 1, 1, 1, 1, GETDATE(), GETDATE()
            FROM [Role] r
            CROSS JOIN [Menu] m
            WHERE LOWER(r.[Name]) = 'admin'
              AND m.[IsActive] = 1
              AND NOT EXISTS (
                SELECT 1 FROM [RoleMenu] rm WHERE rm.[RoleId] = r.[Id] AND rm.[MenuId] = m.[Id]
              );
            """;

        var inserted = await context.Database.ExecuteSqlRawAsync(sql, ct);
        if (inserted > 0)
            logger.LogInformation("Granted Admin role access to {Count} menu item(s).", inserted);
    }

    private static string Escape(string value) => value.Replace("'", "''");
}
