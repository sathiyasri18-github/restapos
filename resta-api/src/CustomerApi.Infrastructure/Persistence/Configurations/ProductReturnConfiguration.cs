using CustomerApi.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CustomerApi.Infrastructure.Persistence.Configurations;

public class ProductReturnConfiguration : IEntityTypeConfiguration<ProductReturn>
{
    public void Configure(EntityTypeBuilder<ProductReturn> builder)
    {
        builder.ToTable("ProductReturn");
        builder.HasKey(x => x.Id).HasName("PK_ProductReturn");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.ImeiNumber).IsRequired(false);
        builder.Property(x => x.CreatedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.CreatedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductReturn_CreatedDate");
        builder.Property(x => x.ModifiedDate).HasDefaultValueSql("GETDATE()");
        builder.Property(x => x.ModifiedDate).HasAnnotation("Relational:DefaultConstraintName", "DF_ProductReturn_ModifiedDate");
    }
}
