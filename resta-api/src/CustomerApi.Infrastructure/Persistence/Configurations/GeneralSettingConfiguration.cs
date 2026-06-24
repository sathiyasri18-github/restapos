using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class GeneralSettingConfiguration : IEntityTypeConfiguration<GeneralSetting>
{
    public void Configure(EntityTypeBuilder<GeneralSetting> builder)
    {
        builder.ToTable("GeneralSetting");
        builder.HasKey(x => x.Id).HasName("PK_GeneralSetting");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.SiteTitle).HasMaxLength(191);
        builder.Property(x => x.SiteTitle).IsRequired();
        builder.Property(x => x.SiteLogo).HasMaxLength(500);
        builder.Property(x => x.SiteLogo).IsRequired(false);
        builder.Property(x => x.Favicon).HasMaxLength(500);
        builder.Property(x => x.Favicon).IsRequired(false);
        builder.Property(x => x.Currency).HasMaxLength(191);
        builder.Property(x => x.Currency).IsRequired();
        builder.Property(x => x.StaffAccess).HasMaxLength(191);
        builder.Property(x => x.StaffAccess).IsRequired();
        builder.Property(x => x.DateFormat).HasMaxLength(191);
        builder.Property(x => x.DateFormat).IsRequired();
        builder.Property(x => x.DevelopedBy).HasMaxLength(191);
        builder.Property(x => x.DevelopedBy).IsRequired(false);
        builder.Property(x => x.InvoiceFormat).HasMaxLength(191);
        builder.Property(x => x.InvoiceFormat).IsRequired(false);
        builder.Property(x => x.Theme).HasMaxLength(191);
        builder.Property(x => x.Theme).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_GeneralSetting_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_GeneralSetting_ModifiedDate");
        builder.Property(x => x.CurrencyPosition).HasMaxLength(191);
        builder.Property(x => x.CurrencyPosition).IsRequired();
    }
}
