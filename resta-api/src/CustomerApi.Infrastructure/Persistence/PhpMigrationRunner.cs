using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CustomerApi.Infrastructure.Persistence;

public static class PhpMigrationRunner
{
    public static async Task ApplyAsync(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken ct = default)
    {
        if (!configuration.GetValue("Database:ApplyPhpMigrationsOnStartup", true))
        {
            logger.LogInformation("PHP migration apply skipped (Database:ApplyPhpMigrationsOnStartup = false).");
            return;
        }

        var scriptPath = Path.Combine(AppContext.BaseDirectory, "Data", "php_migrations.sql");
        if (!File.Exists(scriptPath))
        {
            scriptPath = Path.GetFullPath(Path.Combine(
                AppContext.BaseDirectory, "..", "..", "..", "..",
                "CustomerApi.Infrastructure", "Data", "php_migrations.sql"));
        }

        if (!File.Exists(scriptPath))
        {
            logger.LogWarning("PHP migration script not found at {ScriptPath}", scriptPath);
            return;
        }

        logger.LogInformation("Applying PHP migrations from {ScriptPath}", scriptPath);
        var sql = await File.ReadAllTextAsync(scriptPath, ct);
        var batches = sql.Split(["\r\nGO\r\n", "\nGO\n", "\r\nGO", "\nGO"], StringSplitOptions.RemoveEmptyEntries);

        var connection = context.Database.GetDbConnection();
        var shouldClose = connection.State != System.Data.ConnectionState.Open;
        if (shouldClose)
            await connection.OpenAsync(ct);

        var applied = 0;
        try
        {
            foreach (var batch in batches)
            {
                var lines = batch.Split(["\r\n", "\n"], StringSplitOptions.None)
                    .Where(l => !string.IsNullOrWhiteSpace(l) && !l.TrimStart().StartsWith("--"))
                    .ToList();
                var statement = string.Join(Environment.NewLine, lines).Trim();
                if (string.IsNullOrWhiteSpace(statement))
                    continue;

                await using var command = connection.CreateCommand();
                command.CommandText = statement;
                await command.ExecuteNonQueryAsync(ct);
                applied++;
            }
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }

        var total = await context.SchemaMigrations.CountAsync(ct);
        logger.LogInformation(
            "PHP migration script executed ({BatchCount} batches). SchemaMigration records: {Total}.",
            applied,
            total);
    }
}
