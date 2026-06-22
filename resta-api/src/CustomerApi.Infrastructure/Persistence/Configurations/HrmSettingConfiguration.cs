using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class HrmSettingConfiguration : IEntityTypeConfiguration<HrmSetting>
{
    public void Configure(EntityTypeBuilder<HrmSetting> builder)
    {
        builder.ToTable("HrmSetting");
        builder.HasKey(x => x.Id).HasName("PK_HrmSetting");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Checkin).HasMaxLength(191);
        builder.Property(x => x.Checkin).IsRequired();
        builder.Property(x => x.Checkout).HasMaxLength(191);
        builder.Property(x => x.Checkout).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_HrmSetting_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_HrmSetting_ModifiedDate");
    }
}
