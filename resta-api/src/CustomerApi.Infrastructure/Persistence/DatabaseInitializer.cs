using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CustomerApi.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    private const string EfProductVersion = "8.0.4";

    public static async Task InitializeAsync(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken ct = default)
    {
        if (configuration.GetValue<bool>("Database:CreateIfNotExists"))
            await EnsureDatabaseExistsAsync(configuration, logger, ct);

        if (configuration.GetValue("Database:MigrateOnStartup", true))
            await ApplyEfMigrationsAsync(context, logger, ct);

        if (configuration.GetValue("Database:ApplyPhpMigrationsOnStartup", true))
            await PhpMigrationRunner.ApplyAsync(context, configuration, logger, ct);

        if (configuration.GetValue("Database:SeedOnStartup", true))
            await DatabaseSeeder.SeedAsync(context, logger, ct);
    }

    private static async Task ApplyEfMigrationsAsync(
        ApplicationDbContext context,
        ILogger logger,
        CancellationToken ct)
    {
        var applied = (await context.Database.GetAppliedMigrationsAsync(ct)).ToList();
        if (applied.Count == 0 && await LegacySchemaExistsAsync(context, ct))
        {
            await BaselineEfMigrationsAsync(context, logger, ct);
            return;
        }

        await context.Database.MigrateAsync(ct);
    }

    private static async Task<bool> LegacySchemaExistsAsync(
        ApplicationDbContext context,
        CancellationToken ct)
    {
        var connection = context.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose)
            await connection.OpenAsync(ct);

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText =
                "SELECT CASE WHEN OBJECT_ID(N'dbo.[Account]', N'U') IS NOT NULL THEN 1 ELSE 0 END";
            var result = await command.ExecuteScalarAsync(ct);
            return Convert.ToInt32(result) == 1;
        }
        finally
        {
            if (shouldClose && connection.State == ConnectionState.Open)
                await connection.CloseAsync();
        }
    }

    private static async Task BaselineEfMigrationsAsync(
        ApplicationDbContext context,
        ILogger logger,
        CancellationToken ct)
    {
        await context.Database.ExecuteSqlRawAsync(
            """
            IF OBJECT_ID(N'[__EFMigrationsHistory]', N'U') IS NULL
            CREATE TABLE [__EFMigrationsHistory] (
                [MigrationId] nvarchar(150) NOT NULL,
                [ProductVersion] nvarchar(32) NOT NULL,
                CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
            );
            """,
            ct);

        var migrations = context.Database.GetMigrations();
        foreach (var migration in migrations)
        {
            await context.Database.ExecuteSqlRawAsync(
                """
                IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = {0})
                INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ({0}, {1});
                """,
                migration,
                EfProductVersion);
        }

        logger.LogWarning(
            "Existing database schema detected without EF migration history. Baselined {Count} migration(s).",
            migrations.Count());
    }

    private static async Task EnsureDatabaseExistsAsync(
        IConfiguration configuration,
        ILogger logger,
        CancellationToken ct)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            logger.LogWarning("DefaultConnection is not configured.");
            return;
        }

        var builder = new SqlConnectionStringBuilder(connectionString);
        var databaseName = builder.InitialCatalog;
        if (string.IsNullOrWhiteSpace(databaseName))
        {
            logger.LogWarning("Database name is missing from the connection string.");
            return;
        }

        builder.InitialCatalog = "master";

        await using var connection = new SqlConnection(builder.ConnectionString);
        await connection.OpenAsync(ct);

        await using var command = connection.CreateCommand();
        command.CommandText = $"""
            IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'{databaseName.Replace("'", "''")}')
            BEGIN
                CREATE DATABASE [{databaseName.Replace("]", "]]")}];
            END
            """;
        await command.ExecuteNonQueryAsync(ct);
        logger.LogInformation("Ensured database {DatabaseName} exists.", databaseName);
    }
}
