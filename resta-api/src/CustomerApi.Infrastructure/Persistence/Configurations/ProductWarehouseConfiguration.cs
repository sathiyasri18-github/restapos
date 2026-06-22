using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ProductWarehouseConfiguration : IEntityTypeConfiguration<ProductWarehouse>
{
    public void Configure(EntityTypeBuilder<ProductWarehouse> builder)
    {
        builder.ToTable("ProductWarehouse");
        builder.HasKey(x => x.Id).HasName("PK_ProductWarehouse");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ProductId).HasMaxLength(191);
        builder.Property(x => x.ProductId).IsRequired();
        builder.Property(x => x.ImeiNumber).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductWarehouse_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductWarehouse_ModifiedDate");
    }
}
