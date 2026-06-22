using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ProductQuotationConfiguration : IEntityTypeConfiguration<ProductQuotation>
{
    public void Configure(EntityTypeBuilder<ProductQuotation> builder)
    {
        builder.ToTable("ProductQuotation");
        builder.HasKey(x => x.Id).HasName("PK_ProductQuotation");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductQuotation_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductQuotation_ModifiedDate");
    }
}
