using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CustomerApi.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260624120000_AddGeneralSettingFavicon")]
public partial class AddGeneralSettingFavicon : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "SiteLogo",
            table: "GeneralSetting",
            type: "nvarchar(500)",
            maxLength: 500,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "nvarchar(191)",
            oldMaxLength: 191,
            oldNullable: true);

        migrationBuilder.AddColumn<string>(
            name: "Favicon",
            table: "GeneralSetting",
            type: "nvarchar(500)",
            maxLength: 500,
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Favicon",
            table: "GeneralSetting");

        migrationBuilder.AlterColumn<string>(
            name: "SiteLogo",
            table: "GeneralSetting",
            type: "nvarchar(191)",
            maxLength: 191,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "nvarchar(500)",
            oldMaxLength: 500,
            oldNullable: true);
    }
}
