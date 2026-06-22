using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class PosSettingConfiguration : IEntityTypeConfiguration<PosSetting>
{
    public void Configure(EntityTypeBuilder<PosSetting> builder)
    {
        builder.ToTable("PosSetting");
        builder.HasKey(x => x.Id).HasName("PK_PosSetting");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.StripePublicKey).HasMaxLength(191);
        builder.Property(x => x.StripePublicKey).IsRequired(false);
        builder.Property(x => x.StripeSecretKey).HasMaxLength(191);
        builder.Property(x => x.StripeSecretKey).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PosSetting_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_PosSetting_ModifiedDate");
    }
}
