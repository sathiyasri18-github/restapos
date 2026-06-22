using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ProductPurchaseConfiguration : IEntityTypeConfiguration<ProductPurchase>
{
    public void Configure(EntityTypeBuilder<ProductPurchase> builder)
    {
        builder.ToTable("ProductPurchase");
        builder.HasKey(x => x.Id).HasName("PK_ProductPurchase");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ImeiNumber).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductPurchase_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductPurchase_ModifiedDate");
    }
}
