using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class GiftCardRechargeConfiguration : IEntityTypeConfiguration<GiftCardRecharge>
{
    public void Configure(EntityTypeBuilder<GiftCardRecharge> builder)
    {
        builder.ToTable("GiftCardRecharge");
        builder.HasKey(x => x.Id).HasName("PK_GiftCardRecharge");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_GiftCardRecharge_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_GiftCardRecharge_ModifiedDate");
    }
}
