using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class RewardPointSettingConfiguration : IEntityTypeConfiguration<RewardPointSetting>
{
    public void Configure(EntityTypeBuilder<RewardPointSetting> builder)
    {
        builder.ToTable("RewardPointSetting");
        builder.HasKey(x => x.Id).HasName("PK_RewardPointSetting");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Type).HasMaxLength(191);
        builder.Property(x => x.Type).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_RewardPointSetting_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_RewardPointSetting_ModifiedDate");
    }
}
