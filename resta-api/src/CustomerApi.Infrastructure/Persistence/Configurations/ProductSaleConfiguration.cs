using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ProductSaleConfiguration : IEntityTypeConfiguration<ProductSale>
{
    public void Configure(EntityTypeBuilder<ProductSale> builder)
    {
        builder.ToTable("ProductSale");
        builder.HasKey(x => x.Id).HasName("PK_ProductSale");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ImeiNumber).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductSale_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductSale_ModifiedDate");
    }
}
