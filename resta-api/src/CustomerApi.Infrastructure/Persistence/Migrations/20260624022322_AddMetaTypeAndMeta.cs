using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CustomerApi.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddMetaTypeAndMeta : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "MetaType",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "GETDATE()"),
                ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "GETDATE()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_MetaType", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Meta",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                MetaTypeId = table.Column<int>(type: "int", nullable: false),
                Name = table.Column<string>(type: "nvarchar(191)", maxLength: 191, nullable: false),
                CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "GETDATE()"),
                ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "GETDATE()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Meta", x => x.Id);
                table.ForeignKey(
                    name: "FK_Meta_MetaType",
                    column: x => x.MetaTypeId,
                    principalTable: "MetaType",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Meta_MetaTypeId_Name",
            table: "Meta",
            columns: new[] { "MetaTypeId", "Name" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_MetaType_Code",
            table: "MetaType",
            column: "Code",
            unique: true);

        migrationBuilder.Sql("""
            SET NOCOUNT ON;

            UPDATE [Menu]
            SET [IsActive] = 0,
                [ModifiedDate] = GETDATE()
            WHERE [MenuCode] IN (N'CATEGORY_TYPE', N'CategoryType')
              AND [IsActive] = 1;

            SET IDENTITY_INSERT [Menu] ON;

            MERGE [Menu] AS target
            USING (VALUES
                (213, 2, N'META_TYPE', N'Meta Type', N'/meta-type', N'pi pi-sitemap', 130)
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

            INSERT INTO [RoleMenu] ([RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete], [CreatedDate], [ModifiedDate])
            SELECT r.[Id], 213, 1, 1, 1, 1, GETDATE(), GETDATE()
            FROM [Role] r
            WHERE LOWER(r.[Name]) = N'admin'
              AND NOT EXISTS (
                SELECT 1 FROM [RoleMenu] rm WHERE rm.[RoleId] = r.[Id] AND rm.[MenuId] = 213
              );
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DELETE FROM [RoleMenu] WHERE [MenuId] = 213;
            DELETE FROM [Menu] WHERE [Id] = 213;
            """);

        migrationBuilder.DropTable(name: "Meta");
        migrationBuilder.DropTable(name: "MetaType");
    }
}
