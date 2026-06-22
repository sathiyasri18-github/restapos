using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.ToTable("ProductVariant");
        builder.HasKey(x => x.Id).HasName("PK_ProductVariant");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ItemCode).HasMaxLength(191);
        builder.Property(x => x.ItemCode).IsRequired();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductVariant_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductVariant_ModifiedDate");
    }
}
