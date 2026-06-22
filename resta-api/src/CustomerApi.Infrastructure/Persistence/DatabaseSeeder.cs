using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CustomerApi.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, ILogger logger, CancellationToken ct = default)
    {
        var isFullySeeded = await context.Users.AnyAsync(ct);
        var isPartiallySeeded = await context.Accounts.AnyAsync(ct) && !isFullySeeded;

        if (isFullySeeded)
        {
            logger.LogInformation("Database already seeded.");
            await EnsureMenusSeededAsync(context, logger, ct);
            return;
        }

        if (isPartiallySeeded)
        {
            logger.LogWarning("Detected partial seed state. Clearing tables before re-seeding.");
            await ClearAllTablesAsync(context, ct);
        }

        var seedPath = Path.Combine(AppContext.BaseDirectory, "Data", "restapos_seed.sql");
        if (!File.Exists(seedPath))
        {
            seedPath = Path.GetFullPath(Path.Combine(
                AppContext.BaseDirectory, "..", "..", "..", "..",
                "CustomerApi.Infrastructure", "Data", "restapos_seed.sql"));
        }

        if (!File.Exists(seedPath))
        {
            logger.LogWarning("Seed file not found at {SeedPath}", seedPath);
            return;
        }

        logger.LogInformation("Seeding database from {SeedPath}", seedPath);
        var sql = await File.ReadAllTextAsync(seedPath, ct);
        var batches = sql.Split(["\r\n\r\n", "\n\n"], StringSplitOptions.RemoveEmptyEntries);

        var connection = context.Database.GetDbConnection();
        var shouldClose = connection.State != System.Data.ConnectionState.Open;
        if (shouldClose)
            await connection.OpenAsync(ct);

        try
        {
            foreach (var batch in batches)
            {
                var lines = batch.Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries)
                    .Where(l => !l.TrimStart().StartsWith("--"))
                    .ToList();
                var statement = string.Join(Environment.NewLine, lines).Trim();
                if (string.IsNullOrWhiteSpace(statement))
                    continue;

                await using var command = connection.CreateCommand();
                command.CommandText = statement;
                await command.ExecuteNonQueryAsync(ct);
            }
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }

        logger.LogInformation("Database seeding completed.");

        await SeedMenusAsync(context, logger, ct);
    }

    private static async Task EnsureMenusSeededAsync(
        ApplicationDbContext context,
        ILogger logger,
        CancellationToken ct)
    {
        await MenuRouteSync.SyncAsync(context, logger, ct);
    }

    private static async Task SeedMenusAsync(ApplicationDbContext context, ILogger logger, CancellationToken ct)
    {
        await MenuRouteSync.SyncAsync(context, logger, ct);
    }

    private static async Task ClearAllTablesAsync(ApplicationDbContext context, CancellationToken ct)
    {
        var connection = context.Database.GetDbConnection();
        var shouldClose = connection.State != System.Data.ConnectionState.Open;
        if (shouldClose)
            await connection.OpenAsync(ct);

        try
        {
            await ExecuteCommandAsync(connection,
                "EXEC sp_MSforeachtable @command1 = 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'", ct);
            await ExecuteCommandAsync(connection,
                "EXEC sp_MSforeachtable @command1 = 'DELETE FROM ?'", ct);
            await ExecuteCommandAsync(connection,
                "EXEC sp_MSforeachtable @command1 = 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'", ct);
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }

    private static async Task ExecuteCommandAsync(
        System.Data.Common.DbConnection connection,
        string sql,
        CancellationToken ct)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync(ct);
    }
}
