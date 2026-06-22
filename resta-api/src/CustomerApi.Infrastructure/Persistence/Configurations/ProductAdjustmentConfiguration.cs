using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ProductAdjustmentConfiguration : IEntityTypeConfiguration<ProductAdjustment>
{
    public void Configure(EntityTypeBuilder<ProductAdjustment> builder)
    {
        builder.ToTable("ProductAdjustment");
        builder.HasKey(x => x.Id).HasName("PK_ProductAdjustment");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Action).HasMaxLength(191);
        builder.Property(x => x.Action).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductAdjustment_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductAdjustment_ModifiedDate");
    }
}
