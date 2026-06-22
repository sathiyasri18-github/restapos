using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Product");
        builder.HasKey(x => x.Id).HasName("PK_Product");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Name).HasMaxLength(191);
        builder.Property(x => x.Name).IsRequired();
        builder.Property(x => x.Code).HasMaxLength(191);
        builder.Property(x => x.Code).IsRequired();
        builder.Property(x => x.Type).HasMaxLength(191);
        builder.Property(x => x.Type).IsRequired();
        builder.Property(x => x.BarcodeSymbology).HasMaxLength(191);
        builder.Property(x => x.BarcodeSymbology).IsRequired();
        builder.Property(x => x.Cost).HasMaxLength(191);
        builder.Property(x => x.Cost).IsRequired();
        builder.Property(x => x.Price).HasMaxLength(191);
        builder.Property(x => x.Price).IsRequired();
        builder.Property(x => x.PromotionPrice).HasMaxLength(191);
        builder.Property(x => x.PromotionPrice).IsRequired(false);
        builder.Property(x => x.StartingDate).HasMaxLength(200);
        builder.Property(x => x.StartingDate).IsRequired(false);
        builder.Property(x => x.LastDate).HasColumnType("date");
        builder.Property(x => x.Image).HasMaxLength(500);
        builder.Property(x => x.Image).IsRequired(false);
        builder.Property(x => x.File).HasMaxLength(191);
        builder.Property(x => x.File).IsRequired(false);
        builder.Property(x => x.ProductList).HasMaxLength(191);
        builder.Property(x => x.ProductList).IsRequired(false);
        builder.Property(x => x.VariantList).HasMaxLength(191);
        builder.Property(x => x.VariantList).IsRequired(false);
        builder.Property(x => x.QtyList).HasMaxLength(191);
        builder.Property(x => x.QtyList).IsRequired(false);
        builder.Property(x => x.PriceList).HasMaxLength(191);
        builder.Property(x => x.PriceList).IsRequired(false);
        builder.Property(x => x.ProductDetails).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Product_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_Product_ModifiedDate");
    }
}
